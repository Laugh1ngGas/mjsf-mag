# Лабораторна робота 5. Використання Vue composable

**Виконавець:** Бойчук Богдан Едуардович, група 7.F2.25-2
**Дисципліна:** Сучасні каркаси web-додатків (ЗНУ)

Каталог товарів DummyJSON із пошуком, debounce, скасуванням застарілих запитів і
автоматичним дозавантаженням сторінок. Логіку запиту, затримки й спостереження за
нижнім маркером винесено в composables, а компоненти відповідають за представлення.

## Запуск

```bash
git clone --depth 1 https://github.com/lisnayk/znu-lab-starters.git ../znu-lab-starters
cp -R ../znu-lab-starters/modern-frameworks/labs/05-composables/starter ./lab5
cd lab5
npm ci
npm run dev      # http://localhost:5173
npm run build    # збірка в dist/
```

У PowerShell розділювач `--` у командах `npm run` потрібно брати в лапки: `npm run dev '--' --port 5173`.

| Інструмент | Версія |
| --- | --- |
| Node.js | 25.1.0 |
| npm | 11.15.0 |
| Vue | 3.5.43 |
| Vite | 7.3.6 |
| API | DummyJSON, затримка `delay=1500` мс |

## Структура

```
src/
├── api/
│   └── products.js              createProductsUrl(query, skip), PAGE_SIZE, API_DELAY
├── components/
│   ├── CatalogLoadMore.vue      нижній маркер і стан наступної сторінки
│   ├── ProductCard.vue          один товар
│   ├── ProductCatalog.vue       сітка, завантаження, помилка, порожній стан
│   └── ProductSearchForm.vue    поле пошуку з v-model і стан запиту
├── composables/
│   ├── useDebouncedValue.js     відкладене значення й таймер
│   ├── useFetch.js              запит, AbortController, data / error / isLoading
│   └── useIntersectionObserver.js  IntersectionObserver для цілі
├── styles/
│   └── main.css                 BEM-стилі стартера
├── App.vue                      композиція сторінки, пошук, сторінки, об’єднання результатів
└── main.js
```

## Розподіл відповідальності

| Модуль | Входи | Виходи | Власний стан | Відповідальність |
| --- | --- | --- | --- | --- |
| `App.vue` | — | — | `query`, `skip`, `products`, `total`; результати composables | Поєднання стану пошуку, сторінок, composables і компонентів сторінки; об’єднання сторінок без повторення `id` |
| `ProductSearchForm.vue` | `modelValue`, `isLoading`, `isDebouncing`, `error`, `loaded`, `total`, `delay` | `update:modelValue` | — | Поле пошуку, доступний підпис і рядок стану запиту; HTTP-запитів, URL і таймерів не створює |
| `ProductCatalog.vue` | `products`, `isLoading`, `error` | `retry` | — | Відтворює `ProductCard` з `key = product.id`; вибирає між сіткою, завантаженням, помилкою та порожнім станом |
| `ProductCard.vue` | `product` | — | — | Представлення одного товару: зображення, знижка, категорія, рейтинг, ціна, наявність |
| `CatalogLoadMore.vue` | `loaded`, `total`, `isLoading`, `error`, `hasMore` | `load-more`, `retry` | шаблонне посилання на маркер | Нижній маркер і стан наступної сторінки; список товарів не змінює |
| `useFetch.js` | URL: значення, `ref` або гетер | `data`, `error`, `isLoading`, `abort`, `refetch` | `AbortController` поточного запиту, лічильник повторів | Запит через `fetch`, асинхронний стан і скасування застарілого запиту |
| `useDebouncedValue.js` | джерело (значення, `ref` або гетер), `delay` | readonly `ref` | таймер | Відкладене реактивне значення й очищення таймера під час зміни джерела |
| `useIntersectionObserver.js` | ціль (`ref` або гетер), `callback`, `options` | `isIntersecting`, `stop` | екземпляр `IntersectionObserver`, внутрішній `watch` | Підписка на перетин цілі, повторна підписка після зміни цілі, `disconnect()` під час розмонтування |

Компонент не отримує даних, яких не потребує його шаблон, а composable не повертає
розмітки й не знає, який компонент його викликав.

## Потік стану

```
query → abort активного запиту
  └── debounce 400 мс → requestUrl → useFetch → page
                                      └── merge → products
нижній маркер → load-more → skip + 12 ────────┘
```

1. Кожна зміна сирого `query` у `ProductSearchForm` через `v-model` потрапляє до `App.vue`.
   Спостерігач `watch(query, …, { flush: 'sync' })` одразу викликає `abort()` для активного
   запиту — ще до завершення debounce.
2. `useDebouncedValue(query, 400)` оновлює `debouncedQuery` лише після 400 мс без введення.
   Нове значення синхронно скидає `skip`, `products` і `total`.
3. `requestUrl = computed(() => createProductsUrl(searchTerm, skip))` формує URL через
   `URLSearchParams` (`limit=12`, `skip`, `delay=1500`, за наявності — `q` і шлях `/search`).
4. `useFetch(requestUrl)` читає URL через `toValue()` усередині `watchEffect` і виконує запит
   із власним `AbortController`. Отримана сторінка потрапляє в `data`.
5. Спостерігач за `data` у `App.vue` замінює список для `skip=0` або додає товари з новими
   `id` для наступних сторінок.
6. `CatalogLoadMore` через `useIntersectionObserver` повідомляє подією `load-more`, що нижній
   маркер наблизився до viewport; `loadMore()` перевіряє умови й збільшує `skip` на 12, що
   змінює `requestUrl` і запускає наступний запит.

## Чому відповідальність розподілено саме так

- **ProductSearchForm не формує URL.** Компонент відповідає лише за поле й підпис та
  повідомляє про намір користувача через `update:modelValue`. Параметри API, debounce і
  пагінація — частина стану сторінки, тому URL будує `App.vue` разом із `skip`. Форму можна
  використати з іншим джерелом даних, а `api/products.js` змінювати без змін у розмітці.
- **ProductCatalog не завантажує дані.** Він отримує готовий масив `products` і стани
  `isLoading`/`error` пропсами та лише вибирає між сіткою, завантаженням, помилкою й порожнім
  станом. Якби каталог сам виконував запити, він дублював би `useFetch` і не міг би
  об’єднувати сторінки, якими керує `App.vue`.
- **Очищення ресурсу розміщене в composable, який його створив.** Таймер існує лише всередині
  `useDebouncedValue`, `AbortController` — усередині `useFetch`, `IntersectionObserver` —
  усередині `useIntersectionObserver`. Лише ці модулі знають ідентифікатор таймера, контролер
  поточного запуску та екземпляр observer, тому лише вони можуть надійно звільнити ресурс:
  через `onCleanup` спостерігача, `onBeforeUnmount` або `disconnect()`. Компонент, що викликає
  composable, отримує тільки результат і не може «забути» про очищення.

## Чому debounce не замінює abort

Debounce відкладає **створення** нового запиту на 400 мс, але не впливає на запит, який
**уже виконується**. Якщо початковий запит (затримка 1500 мс) триває, а користувач уводить
`phone`, без `abort()` стара відповідь прийде пізніше й буде показана замість актуальної або
перезапише її. `abort()` негайно скасовує застарілий запит, а debounce зменшує кількість нових
запитів під час швидкого введення. Тому сирий `query` керує скасуванням, а відкладений
`debouncedQuery` — формуванням нового URL. Скасований запит — очікуване завершення, тому він
не потрапляє до `error`.

## Таблиця перевірок

Перевірки виконано в Chrome із DevTools (Network, збереження журналу) на `http://localhost:5173`.
URL наведено відносно `https://dummyjson.com`.

| № | Перевірка | Очікуваний результат | Фактичний URL | Карток | Стан інтерфейсу |
| --- | --- | --- | --- | --- | --- |
| 0 | Стартер до змін: введення `phone`, прокручування | Список і сторінка не змінюються, нових запитів немає | `/products?limit=12&delay=1500` (один запит) | 12 | «Показано 12 із 194 товарів», нижній блок без автозавантаження |
| 1 | Початкове завантаження | `limit=12`, `skip=0`, `delay=1500`; 12 карток | `/products?limit=12&skip=0&delay=1500` — 200 | 12 | «Початкова добірка», «Показано 12 із 194 товарів» |
| 2 | Швидке введення `p`, `ph`, `phone` під час запиту | Активний запит скасовано; після 400 мс один запит із `q=phone` | `/products?limit=12&skip=0&delay=1500` — canceled; `/products/search?limit=12&skip=0&delay=1500&q=phone` — 200 | 12 | Під час введення «Очікуємо завершення введення…», далі «Пошук: «phone»», 12 із 23; помилки немає |
| 3 | Рядок, якого немає в назвах | Порожній стан без помилки в консолі | `/products/search?limit=12&skip=0&delay=1500&q=zzqx` — 200 | 0 | «Нічого не знайдено», консоль без помилок |
| 4 | Очищення поля | Початковий каталог, запит без `q` | `/products?limit=12&skip=0&delay=1500` — 200 | 12 | «Початкова добірка» |
| 5 | Прокручування до нижнього маркера | Сторінки `skip=12` і `skip=24`, попередні картки лишаються, `id` не повторюються | `/products?limit=12&skip=12&delay=1500`, `/products?limit=12&skip=24&delay=1500` — 200 | 12 → 24 → 36 | Усі `id` унікальні; під час запиту спінер лише в нижньому блоці |
| 6 | Новий пошук після дозавантаження | Починається з `skip=0`, без товарів попередньої видачі | `/products/search?limit=12&skip=0&delay=1500&q=phone` — 200 | 12 | «Пошук: «phone»», старих карток немає |
| 7 | Отримано всі знайдені товари | Повідомлення про завершення, нових запитів немає | `/products/search?limit=12&skip=12&delay=1500&q=phone` — 200; далі запитів немає | 23 | «23 / 23 · Усі товари завантажено» |
| 8a | Offline під час дозавантаження, повтор після відновлення | Помилка в нижньому блоці, картки лишаються; повтор завантажує ту саму сторінку | `/products?limit=12&skip=12&delay=1500` — `ERR_INTERNET_DISCONNECTED`, потім той самий URL — 200 | 12 → 24 | «Не вдалося отримати сторінку», кнопка «Повторити запит» |
| 8b | Offline під час початкового завантаження | Блок помилки з повтором | `/products?limit=12&skip=0&delay=1500` — `ERR_INTERNET_DISCONNECTED`, після повтору — 200 | 0 → 12 | «Каталог тимчасово недоступний», «Failed to fetch» |
| 9 | Ширини 390 і 1440 px | Без горизонтальної прокрутки, обрізаного тексту, недоступних кнопок | — | — | `scrollWidth` = ширині viewport в обох випадках |

## Виробнича збірка

```
> vite build
vite v7.3.6 building client environment for production...
✓ 18 modules transformed.
dist/index.html                  0.60 kB │ gzip:  0.39 kB
dist/assets/index-BMnof_N4.css  10.06 kB │ gzip:  2.90 kB
dist/assets/index-DrHhafXE.js   74.79 kB │ gzip: 29.48 kB
✓ built in 1.73s
```
