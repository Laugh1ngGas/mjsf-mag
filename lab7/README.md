# Лабораторна робота 7. Приватна сторінка редагування товарів із Pinia та Vue Router

**Виконавець:** Бойчук Богдан Едуардович, група 7.F2.25-2
**Дисципліна:** Сучасні каркаси web-додатків (ЗНУ)

Каталог товарів DummyJSON із лабораторної роботи 6 доповнено приватним розділом:
- вхід через DummyJSON Auth і відновлення сеансу після reload;
- приватний список товарів і редактор, захищені `meta.requiresAuth` та глобальним гардом;
- підтверджені зміни товарів у спільному сховищі Pinia.

Публічний каталог, пошук із `q`, сторінки товару, відгуки й крихти роботи 6 працюють як раніше.

## Запуск

```bash
# із кореня репозиторію: копія lab6 без node_modules, dist і .git
robocopy lab6 lab7 /E /XD node_modules dist .git
cd lab7
npm ci
npm install --save-exact vue@3.5.43 vue-router@4.6.4 pinia@3.0.4
npm run dev -- --port 5177 --strictPort   # http://localhost:5177
```

У PowerShell розділювач `--` потрібно брати в лапки: `npm run dev '--' --port 5177 --strictPort`.

| Інструмент | Версія |
| --- | --- |
| Node.js | 25.1.0 |
| npm | 11.15.0 |
| Vue | 3.5.43 |
| Vue Router | 4.6.4 |
| Pinia | 3.0.4 |
| Vite | 7.3.6 |

Навчальний обліковий запис DummyJSON: `emilys` (пароль наведено в методичних вказівках, у
репозиторії та звіті він не зберігається).

## Структура

```
src/
├── stores/
│   ├── index.js                   єдиний createPinia()
│   ├── auth.js                    Setup Store сеансу: accessToken, user, status, error
│   └── products.js                Setup Store підтверджених змін товарів за id
├── api/
│   ├── http.js                    requestJson: response.ok, HttpError.status, AbortSignal, Bearer, credentials: 'omit'
│   ├── productDraft.js            чернетка, нормалізація й перевірка полів
│   └── products.js                публічні URL каталогу (робота 6)
├── auth/session.js                sessionStorage токена, POST /auth/login, GET /auth/me, подія завершення сеансу
├── composables/
│   ├── usePrivateResource.js      приватне читання: data / isLoading / error, скасування
│   └── …                          useFetch, useBreadcrumbs, useDebouncedValue, useIntersectionObserver
├── router/
│   ├── index.js                   маршрути, ліниві приватні представлення
│   └── guards.js                  beforeEach, перевірка redirect, реакція на завершення сеансу
├── layouts/ManageLayout.vue       приватна оболонка: вміст лише для підтвердженого сеансу
├── views/
│   ├── LoginView.vue              форма входу, повтор перевірки сеансу
│   ├── ManageProductsView.vue     приватний список із перегортанням через skip
│   └── ProductEditView.vue        редактор: чернетка, перевірка, збереження, захист від втрати
├── App.vue                        шапка: ім’я користувача, «Вийти», стан перевірки сеансу
└── main.js                        createApp(App).use(pinia).use(router).mount('#app')
```

## Власники стану

| Стан | Власник | Чому |
| --- | --- | --- |
| Ім’я користувача й пароль у формі | `LoginView` (локальні `ref`) | Потрібні лише формі; пароль передається аргументом `login()` і одразу очищується |
| Чернетка `title / price / stock / description`, помилки полів, `isSaving` | `ProductEditView` | Чернетка не є підтвердженими даними; інші представлення її не бачать |
| `accessToken`, `user`, `status`, `error` | `auth` store | Спільні для шапки, гарда, приватних запитів і форми входу |
| Підтверджені зміни товарів за id | `products` store | Потрібні списку керування, публічній сторінці, крихті та карткам каталогу |
| `data / isLoading / error` приватного читання | `usePrivateResource` у компоненті | Належать конкретному представленню й очищуються з ним |
| Пошук `q`, `id` товару, сторінка списку `skip` | Маршрут | Як у роботі 6: адреса відновлює стан після reload |

## Відповідальність модулів

| Модуль | Відповідальність | Чого не робить |
| --- | --- | --- |
| `stores/index.js` | Один екземпляр `createPinia()` для `main.js` і гарда | — |
| `stores/auth.js` | State (`ref`): `accessToken`, `user`, `status`, `error`. Getters (`computed`): `isAuthenticated`, `isBusy`, `displayName`. Actions: `login`, `restore`, `retryRestore`, `logout`, `expire`, `request`, `$reset` | Не зберігає пароль, refresh token і профіль у Web Storage. `AbortController`, номер сеансу й Promise перевірки — службові змінні, а не state |
| `stores/products.js` | `confirmedChanges` за id; `withChanges(product)` поєднує прочитаний товар зі змінами сеансу; `save(id, values)`; `reset()` | Не зберігає чернетку й не записує словник у Web Storage |
| `api/http.js` | `fetch` з `credentials: 'omit'`, JSON-тіло, `Authorization: Bearer`, перевірка `response.ok`, `HttpError.status` (0 — мережа), передавання `AbortSignal` | Не знає про store й маршрути |
| `api/productDraft.js` | `createDraft`, `normalizeDraft`, `validateDraft`, `isDraftChanged` | Не виконує запитів |
| `auth/session.js` | Ключ `forma.lab7.accessToken` у sessionStorage, запити входу й профілю, сповіщення `onSessionEnd` | Не зберігає нічого, крім access token |
| `usePrivateResource.js` | `watch` адреси з `onCleanup`: очищення даних, скасування старого запиту, ігнорування застарілої відповіді | — |
| `router/guards.js` | `beforeEach` чекає `auth.restore()` для приватних маршрутів і `/login`. `resolveSafeRedirect` пропускає лише `manage-products` / `manage-edit`. Після `logout` / `expire` викликає `products.reset()` і прибирає відкриту приватну сторінку | Не замінює серверної перевірки доступу |
| `ManageLayout.vue` | Пояснення меж змін і `RouterView` лише за `isAuthenticated` | — |
| `LoginView.vue` | Форма з підписами, помилкою `role="alert"`, блокуванням під час входу, кнопкою «Повторити перевірку» для стану `unavailable` | Не зберігає пароль після надсилання |
| `ManageProductsView.vue` | 12 товарів (назва, ціна, залишок, «Редагувати»), «Попередня» / «Наступна» через `query.skip`, завантаження, помилка з повтором | — |
| `ProductEditView.vue` | Читання за id, стани «некоректний id» / 404 / помилка. Локальна чернетка, помилки біля полів (`aria-describedby`, `aria-invalid`), фокус на першу помилку. Збереження, «Скасувати зміни», `onBeforeRouteLeave`, `onBeforeRouteUpdate`, `beforeunload` | Не змінює store до успішного PATCH |
| `App.vue` | `useAuthStore()` і `useProductsStore()` у setup (видимі в DevTools), `storeToRefs` для шапки | — |

## Маршрути

| Шлях | Ім’я | Компонент | Доступ |
| --- | --- | --- | --- |
| `/products`, `/products/:id`, `/products/:id/reviews`, `/about` | як у роботі 6 | — | Публічний |
| `/login` | `login` | `LoginView` (основний bundle) | Публічний; підтвердженого користувача перенаправляє до перевіреної цілі |
| `/manage/products` | — | `ManageLayout` (lazy), `meta: { requiresAuth: true, breadcrumb: 'Керування' }` | Після підтвердження сеансу |
| ↳ `''` | `manage-products` | `ManageProductsView` (lazy) | успадковує `requiresAuth` через `to.meta` |
| ↳ `:id/edit` | `manage-edit` | `ProductEditView` (lazy), `meta.breadcrumb: dynamic product` | успадковує `requiresAuth` |

Порожній дочірній шлях не має власної крихти, тому «Керування» не дублюється. Редактор додає
реактивну назву товару, яка змінюється після успішного збереження.

`LoginView` підключено статично. Форма входу є запасною сторінкою для станів `guest` і
`unavailable`, тому вона має відкриватися навіть без мережі. Приватні представлення
завантажуються окремими чанками.

## Життєвий цикл сеансу

```
idle ──restore()──► restoring ──200──► authenticated ──logout()──► guest
 │  (немає токена)       │ 401 → токен вилучено ─────────────────► guest
 └──────────► guest      │ мережа → unavailable ──retryRestore()──► restoring
guest / unavailable ──login()──► signing-in ──200──► authenticated
                                         └─400──► guest (+ error)
authenticated ──401 приватного API (той самий токен)──► expire() ──► guest
```

1. **Вхід.** `login()` надсилає `POST /auth/login` (`expiresInMins: 30`). Під час `signing-in` повторний виклик повертає `false`, кнопка й поля заблоковані. Після 200 у state записуються токен і профіль, а в sessionStorage — лише токен. Форма через `router.replace` відкриває ціль, яку перевірив `resolveSafeRedirect`.
2. **Reload.** `beforeEach` викликає `restore()`. За наявності токена виконується один `GET /auth/me`; одночасні виклики чекають той самий Promise. До відповіді `isAuthenticated === false`. Для публічних сторінок перевірка запускається без очікування, тож каталог не затримується; для `/manage/**` і `/login` гард чекає результат.
3. **401** на `/auth/me` вилучає токен. **Мережева помилка** дає `unavailable`: приватний вміст закрито, токен лишається, у шапці та формі входу є «Повторити».
4. **Приватні запити** йдуть через `auth.request()`, який бере поточний токен. 401 завершує сеанс лише тоді, коли токен у store досі той самий, тому відповідь старого токена не перериває новий сеанс.
5. **Вихід і `expire()`** скасовують незавершену перевірку чи вхід, збільшують номер сеансу, очищують state і sessionStorage та сповіщають `onSessionEnd`:
   - `products.reset()` очищує словник змін і скасовує збереження;
   - відкрита приватна сторінка закривається: після 401 відкривається `/login?redirect=…`, після звичайного виходу — каталог.

   Гард чернетки після завершення сеансу не втручається.
6. **Збереження.** `products.save()` надсилає `PATCH /auth/products/:id` лише з чотирма полями. Відповідь записується до словника, тільки якщо номер операції, токен і стан сеансу не змінилися. Інакше виникає `StaleOperationError`, і словник не змінюється.

## Межі навчальної моделі

- **DummyJSON не зберігає змін.** `PATCH /auth/products/:id` повертає змінений товар, але наступний `GET` знову віддає початкові дані. Тому підтверджені зміни зберігаються лише у `products` store до reload або виходу, і інтерфейс це пояснює. Серверний пошук працює з початковими даними DummyJSON, а локальні зміни не перебудовують його набір.
- **sessionStorage** живе в межах вкладки: токен переживає reload, але не закриття вкладки. Він доступний JavaScript сторінки, тому застосунок не зберігає там пароль, профіль чи refresh token. Наявність токена не означає входу, доки його не підтвердить `/auth/me`.
- **`credentials: 'omit'`.** DummyJSON також ставить cookie, але обрана модель використовує лише явний заголовок `Authorization: Bearer …`. Токени й паролі не потрапляють в URL.
- **Клієнтська частина не захищає дані.** Гард і `isAuthenticated` лише керують інтерфейсом, доступ перевіряє сервер (401). Локальний вихід не відкликає виданий токен; refresh token і серверне відкликання сеансу в роботі не реалізовано.

## Таблиця сценаріїв

Перевірки виконано на `http://localhost:5177` у Chrome 157 через DevTools Protocol. Скрипти
відстежували Network: `/auth/*` окремо від завантаження модулів коду, `OPTIONS`-preflight не
враховано. Значення токенів і паролів не виводилися.

| № | Сценарій | Очікуваний результат | Фактичний результат | URL | HTTP-статус | Кількість запитів |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Гість відкриває редактор напряму, потім входить | Форма входу без редактора; після входу — ціль | Форма входу, приватних запитів немає; після входу — «Редагування товару №12», у шапці Emily Johnson | `/manage/products/12/edit` → `/login?redirect=/manage/products/12/edit` → `/manage/products/12/edit` | login 200, products/12 200 | POST login: 1 |
| 2 | Неправильний пароль, подвійне натискання й `requestSubmit` | Помилка, токена немає, другого POST немає | «Неправильне ім’я користувача або пароль.», поле пароля очищено, фокус на ньому, sessionStorage порожній | `/login?redirect=…` | 400 | POST login: 1 |
| 3a | Reload з чинним токеном | Один `/auth/me`, редактор відновлено | `GET /auth/me` 200, далі `GET /auth/products/12` 200 | `/manage/products/12/edit` | 200 | /auth/me: 1 |
| 3b | Підроблений токен у sessionStorage | Токен вилучено, доступу немає | `/auth/me` 401, токен вилучено, форма входу з поясненням | `/login?redirect=/manage/products/12/edit` | 401 | /auth/me: 1 |
| 3c | `redirect` на `https://evil.example/`, `//evil.example/x`, `/login`, `/products/1` | Відкривається список керування | Кожного разу `/manage/products`; `?redirect=/manage/products?skip=24` відкриває саме цю сторінку | `/login?redirect=…` | 200 | POST login: 1 на кожну спробу |
| 4 | `delay=1500` у `/auth/me`, reload, Offline під час запиту | Приватний вміст закрито, токен лишився; після Online — повтор | `ERR_INTERNET_DISCONNECTED` → `unavailable`: «Сеанс не перевірено / Повторити», токен є, редактора немає. Після Online «Повторити перевірку» → 200 і повернення до редактора. Затримку прибрано | `/login?redirect=/manage/products/12/edit` → `/manage/products/12/edit` | failed → 200 | /auth/me: 2 |
| 5a | Перегортання списку, потрійне натискання «Наступна» | Одна сторінка, один запит | `skip=12`, 1 запит; «Попередня» повертає `skip=0`; кнопки заблоковані під час запиту | `/manage/products?skip=12` | 200 | GET: 1 на перехід |
| 5b | «Редагувати» в рядку 12 | Редактор id 12, крихта з назвою | «Керування / Annibale Colombo Sofa» | `/manage/products/12/edit` | 200 | GET: 1 |
| 5c | Некоректний і відсутній id | Без запиту / окремий стан 404 | `abc`: «Товар не знайдено», запитів 0; `99999`: 404 → «Товару №99999 немає в API» | `/manage/products/abc/edit`, `/manage/products/99999/edit` | — / 404 | 0 / 1 |
| 6 | Порожня назва, ціна 0, залишок 1.5, порожній опис; потім порожні ціна й залишок | Помилки біля полів, фокус на першій, PATCH немає | 4 помилки, `aria-invalid="true"`, фокус `#edit-title`; потім «Вкажіть ціну.» і «Вкажіть залишок.», фокус `#edit-price` | `/manage/products/12/edit` | — | PATCH: 0 |
| 7 | Зміна поля без збереження, вихід, зміна id, «Скасувати зміни» | Список і крихта не змінюються; відмова лишає чернетку; скасування без запиту | Store порожній, крихта стара. `confirm` при «До списку» і переході на id 13: відмова лишає чернетку. «Скасувати зміни» відновлює дані без запитів | `/manage/products/12/edit` | — | HTTP: 0 |
| 8 | Успішне збереження (подвійне натискання) | Один PATCH, оновлено список, публічну сторінку, крихту й картку | PATCH з полями `title, price, stock, description`, поля заблоковані під час запиту. Нова назва в крихті, у списку з позначкою «змінено в сеансі», на `/products/12` з поясненням, у картці каталогу. Після reload — серверні значення й новий `/auth/me` | `/manage/products/12/edit`, `/products/12`, `/products` | 200 | PATCH: 1 |
| 9 | PATCH в Offline, потім Online | Помилка, чернетка лишається; повтор успішний | `ERR_INTERNET_DISCONNECTED` → «Не вдалося зберегти… Чернетку збережено», підтверджені дані без змін; повтор → 200 | `/manage/products/12/edit` | failed → 200 | PATCH: 2 |
| 10 | `delay=3000` у PATCH, збереження й одразу «Вийти» | Пізня відповідь не повертає сеанс чи зміни | PATCH `canceled`, каталог, токена немає, словник порожній. Новий вхід — без позначок змін, рядок 12 має серверну назву. Затримку прибрано | `/manage/products/12/edit` → `/products` | canceled | PATCH: 1 |
| 11 | Тимчасово `Authorization: Bearer invalid` для одного `/auth/products` | Клієнт завершує сеанс | 401 → токен вилучено, `guest`, вхід із «Сеанс завершено: сервер не прийняв токен (401)». Діагностичну зміну прибрано | `/manage/products` → `/login?redirect=/manage/products` | 401 | GET: 1 |
| 12 | Вхід, список, редактор (з помилкою валідації) за 360×800, 768×1024, 1440×900, 844×390; Tab / Shift+Tab / Enter | Без горизонтального переповнення; нові дії ≥ 44×44; клавіатура | Елементів за межами ширини немає, кнопки, посилання й поля ≥ 44 px. Tab: назва → ціна → залишок → опис → «Зберегти» → «До списку» (неактивне «Скасувати» пропускається), Shift+Tab повертає. У формі входу Tab переходить до пароля, Enter виконує вхід | `/login`, `/manage/products`, `/manage/products/12/edit` | — | — |
| — | Вихід із брудною чернеткою; reload із брудною чернеткою | Вихід без підтвердження; reload — попередження браузера | Вихід: `confirm` не з’являється, каталог, словник порожній. Reload: діалог `beforeunload` | `/manage/products/12/edit` | — | — |

## Виробнича збірка й preview

```bash
# dev-сервер зупинено (Ctrl+C)
npm run build
npm exec vite preview -- --port 5177 --strictPort   # у PowerShell: '--'
```

`npm run build` створює основний bundle (`index-*.js`, 135 kB, gzip 51 kB) і окремі чанки
приватного розділу: `ManageLayout`, `ManageProductsView`, `ProductEditView`, `usePrivateResource`.
`git check-ignore dist node_modules` підтверджує, що обидва каталоги не потрапляють до Git.

Перевірки через `http://localhost:5177` (vite preview):

| Перевірка | Результат |
| --- | --- |
| Пряма адреса `/manage/products/12/edit` гостем | Документ 200, `/login?redirect=/manage/products/12/edit`; чанки приватного розділу не завантажуються, запитів `/auth/*` немає |
| Вхід | POST `/auth/login` 200, потім завантажуються `ManageLayout-*.js`, `ProductEditView-*.js`, `usePrivateResource-*.js` і JSON `GET /auth/products/12` 200 |
| Reload приватної адреси | Документ 200, один `GET /auth/me` 200, редактор відновлено |
| Збереження | `PATCH /auth/products/12` 200, рядок у списку керування показує нову назву з позначкою «змінено в сеансі» |
| Вихід | Публічний каталог, токен і словник змін очищено |
| `/manage/products?skip=12` гостем | Документ 200, `/login?redirect=/manage/products?skip=12` |
| Скрипти | Лише `/assets/*` зібраної версії, без модулів `/src` |

Vite preview перевіряє локальну збірку; публікація сайту належить до окремої теми deployment.
Для `createWebHistory` виробничий сервер має повертати `index.html` для адрес застосунку
(див. README роботи 6).

Діагностичні зміни для сценаріїв 4, 10 і 11 вносилися тимчасово й після перевірки відкочені.
Сценарій 4 автоматизовано так: запит `/auth/me` утримується через CDP Fetch, вмикається Offline,
і запит завершується помилкою `InternetDisconnected`. У DevTools Offline не обриває запит, який
уже виконується без увімкненого throttling.
