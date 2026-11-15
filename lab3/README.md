# Лабораторна робота 3. Адаптивне модальне вікно: слоти, ref, Teleport і Transition

**Виконавець:** Бойчук Богдан Едуардович, група 7.F2.25-2
**Дисципліна:** Сучасні каркаси web-додатків (ЗНУ)

Каталог навчальних матеріалів із лабораторної роботи 2, розширений
перевикористовуваним компонентом `ModalDialog`. Той самий постійно змонтований
екземпляр вікна використовується у двох сценаріях: редагування назви й тривалості
матеріалу та підтвердження його видалення. Дані зберігаються лише в пам'яті.

## Версії

| Інструмент | Версія |
| --- | --- |
| Node.js | 25.1.0 |
| npm | 11.15.0 |
| Vue | 3.5.45 |
| Vite | 8.3.8 |
| @vitejs/plugin-vue | 6.0.11 |
| Tailwind CSS | 3.4.17 |
| PostCSS | 8.5.6 |
| Autoprefixer | 10.4.21 |

Tailwind, PostCSS та Autoprefixer встановлено з точними версіями
(`--save-exact`); усі версії відтворюються за `package-lock.json`.

## Запуск і збірка

```bash
npm ci                                   # встановлення залежностей за lock-файлом
npm run dev -- --port 5173 --strictPort  # розробка: http://localhost:5173
npm run build                            # продакшн-збірка в dist/
npm run preview -- --port 4173 --strictPort  # перевірка збірки: http://localhost:4173
```

Підключення Tailwind виконано командами:

```bash
npm install -D --save-exact tailwindcss@3.4.17 postcss@8.5.6 autoprefixer@10.4.21
npx tailwindcss init -p
```

## Конфігурація Tailwind / PostCSS

- `tailwind.config.js` — `content: ['./index.html', './src/**/*.{vue,js}']`,
  `corePlugins: { preflight: false }` (глобальне скидання вимкнено, щоб не змінити
  BEM-розмітку каталогу).
- `postcss.config.js` — плагіни `tailwindcss` і `autoprefixer`.
- `src/style.css` — наприкінці директиви `@tailwind base; @tailwind components;
  @tailwind utilities;`; файл імпортується в `src/main.js`.

Власний CSS каталогу з роботи 2 збережено; діалог, нові кнопки й поля оформлено
повними класами Tailwind.

## Структура компонентів

```
src/
├── main.js                    створення застосунку, імпорт style.css
├── style.css                  стилі каталогу + директиви Tailwind
├── data/materials.js          початковий масив матеріалів (не змінюється)
├── App.vue                    розмітка сторінки: шапка з ПІБ, групою й середовищем,
│                              заголовок, <MaterialCatalog />, підвал
└── components/
    ├── MaterialCatalog.vue    стан і предметні дії: робочий список, фільтри,
    │                          вибір за id, режим діалогу, чернетка, збереження
    │                          й видалення
    ├── MaterialFilterForm.vue форма фільтрів; повідомляє apply / clear
    ├── MaterialCard.vue       картка; повідомляє select / edit / delete
    └── ModalDialog.vue        універсальне модальне вікно
```

Потік даних: `MaterialCatalog` → пропси → `MaterialCard`; картка й форма фільтрів
лише повідомляють про намір подіями. `ModalDialog` не знає про матеріали: заголовок
отримує пропсом, форму, текст і кнопки — слотами від каталогу.

## Контракт ModalDialog

### Пропси

| Пропс | Тип | За замовчуванням | Призначення |
| --- | --- | --- | --- |
| `modelValue` | `Boolean` | `false` | чи відкрите вікно (через `v-model`) |
| `title` | `String` | обов'язковий | текст заголовка панелі |
| `initialFocus` | `HTMLElement` | `null` | елемент, який отримує фокус після відкриття |
| `fallbackFocus` | `HTMLElement` | `null` | куди повернути фокус, якщо елемент виклику зник або прихований |

### Події

| Подія | Коли |
| --- | --- |
| `update:modelValue` (`false`) | хрестик «Закрити вікно», Escape, натискання на підкладку |

Компонент не змінює пропси: закриття — це лише запит до батьківського компонента.

### Слоти

| Слот | Пропси слота | Вміст |
| --- | --- | --- |
| за замовчуванням | — | основний вміст: форма або текст підтвердження |
| `footer` | `{ close }` | кнопки дій поточного сценарію |

### Приклад використання

```vue
<ModalDialog
  v-model="isOpen"
  :title="dialogTitle"
  :initial-focus="dialogMode === 'edit' ? titleInput : cancelDeleteButton"
  :fallback-focus="catalogHeading"
>
  <form id="material-edit-form" @submit.prevent="saveEdit">…</form>

  <template #footer>
    <button type="button" @click="isOpen = false">Скасувати</button>
    <button type="submit" form="material-edit-form">Зберегти</button>
  </template>
</ModalDialog>
```

### Поведінка

- **Розмітка:** `Teleport to="body"` → `Transition` → підкладка з `v-if="modelValue"`
  (`fixed inset-0`) → панель. Компонент змонтований постійно; `v-if` на самому
  `ModalDialog` у каталозі не використовується.
- **Семантика:** панель має `role="dialog"`, `aria-modal="true"` і
  `aria-labelledby` на заголовок з унікальним id (`useId()`).
- **Закриття:** хрестик, Escape (обробник `keydown` на панелі), кнопка
  «Скасувати» у слоті, `@click.self` на підкладці; натискання всередині панелі
  вікно не закриває.
- **Фокус:** перед відкриттям запам'ятовується `document.activeElement`; після
  `nextTick` фокус переходить на `initialFocus` або на панель (`tabindex="-1"`),
  після `after-enter` уточнюється. Tab / Shift+Tab циклічно обходять актуальний
  перелік видимих доступних елементів панелі.
- **Фон:** після перенесення фокуса `#app` отримує `inert`, `body` —
  `overflow: hidden`; попередні значення зберігаються. Відновлення виконується в
  `after-leave` (якщо вікно не відкрили повторно) та в `onBeforeUnmount`, без
  таймерів. Потім фокус повертається на елемент виклику або на `fallbackFocus`.
- **Переходи:** класи Tailwind передано параметрами `Transition`
  (`opacity-0` ↔ `opacity-100`, `transition-opacity duration-150
  motion-reduce:transition-none`).
- **Адаптивність:** підкладка `p-4`, панель `w-full max-w-screen-sm
  max-h-[calc(100dvh-2rem)] flex flex-col`; заголовок і footer `shrink-0`,
  основний вміст `min-h-0 overflow-y-auto break-words`; кнопки footer
  `flex-col` до 640 px і `sm:flex-row sm:justify-end` від 640 px; кнопки
  `min-h-11 min-w-11`, поля `min-h-11`.

## Сценарії в MaterialCatalog

- **Редагування.** Перед відкриттям створюється свіжа чернетка
  (`draft = ref({ title, minutes })`) і очищуються помилки. Форма
  `id="material-edit-form"` надсилається кнопкою «Зберегти» з footer
  (`type="submit" form="material-edit-form"`) або клавішею Enter. Назва
  перевіряється після `trim()`, тривалість — `Number.isInteger()` і `> 0`. Після
  успіху запис замінюється за id; список, фільтрація, кількість і сума
  перераховуються через `computed`.
- **Видалення.** Режим `delete` того самого вікна: назва матеріалу й наслідок дії,
  кнопки «Скасувати» (початковий фокус) і «Видалити». Запис видаляється за id лише
  після підтвердження; якщо видалено обраний — обирається перший із решти або
  `null`. Режим і вміст не очищуються до завершення анімації зникнення.

## ref і слоти

- **Реактивний `ref`** зберігає дані стану (`isOpen`, `items`, `draft`,
  `selectedId`); зміна `.value` оновлює інтерфейс.
- **Шаблонний `ref`** (`ref="titleInput"`, `ref="panel"`) після монтування
  містить DOM-елемент і потрібен для `focus()`. До монтування та після
  демонтажу (`v-if`) він дорівнює `null`.
- **Слоти** передають розмітку: каталог визначає форму й кнопки, а `ModalDialog`
  лише розміщує їх. Вміст слота компілюється в контексті каталогу, тому кнопки
  напряму викликають `saveEdit` і `confirmDelete`.
