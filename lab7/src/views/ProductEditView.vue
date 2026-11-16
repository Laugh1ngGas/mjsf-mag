<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { isValidProductId } from '../api/products.js'
import { isAbortError } from '../api/http.js'
import {
  DESCRIPTION_MAX,
  EDITABLE_FIELDS,
  TITLE_MAX,
  createDraft,
  isDraftChanged,
  validateDraft,
} from '../api/productDraft.js'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'
import { usePrivateResource } from '../composables/usePrivateResource.js'
import { useAuthStore } from '../stores/auth.js'
import { StaleOperationError, useProductsStore } from '../stores/products.js'

const route = useRoute()
const auth = useAuthStore()
const products = useProductsStore()

const productId = computed(() => (isValidProductId(route.params.id) ? route.params.id : null))

// Некоректний id не створює запиту: path === null.
const path = computed(() => (productId.value ? `/auth/products/${productId.value}` : null))
const { data, error, isLoading, refetch } = usePrivateResource(path)

const loaded = computed(() => (data.value && String(data.value.id) === productId.value ? data.value : null))
// Поточні підтверджені значення: прочитаний товар + зміни цього сеансу зі store.
const confirmed = computed(() => products.withChanges(loaded.value))

const isInvalidId = computed(() => !productId.value)
const isNotFound = computed(() => error.value?.status === 404)

const breadcrumbs = useBreadcrumbs(() => {
  if (isInvalidId.value || isNotFound.value)
    return 'Товар не знайдено'

  return confirmed.value?.title ?? `Товар №${route.params.id}`
})

// Локальна чернетка: окремий об’єкт, а не завантажений товар.
const draft = reactive(createDraft(null))
const initial = shallowRef(createDraft(null))
const errors = ref({})
const isSaving = ref(false)
const saveError = ref('')
const savedMessage = ref('')
const fieldRefs = {}

const isDirty = computed(() => Boolean(confirmed.value) && isDraftChanged(draft, initial.value))

function fillFromConfirmed() {
  const values = createDraft(confirmed.value)
  initial.value = values
  Object.assign(draft, values)
  errors.value = {}
}

// Новий товар (або повторне завантаження) заповнює чернетку підтвердженими значеннями.
watch(loaded, (product) => {
  saveError.value = ''
  savedMessage.value = ''

  if (product)
    fillFromConfirmed()
}, { immediate: true })

const describedBy = (field) =>
  [`edit-${field}-hint`, errors.value[field] ? `edit-${field}-error` : null].filter(Boolean).join(' ')

async function save() {
  if (isSaving.value || !confirmed.value)
    return

  savedMessage.value = ''
  saveError.value = ''

  const { values, errors: found, isValid } = validateDraft(draft)
  errors.value = found

  if (!isValid) {
    // Без PATCH: фокус переходить до першого поля з помилкою.
    await nextTick()
    const first = EDITABLE_FIELDS.find((field) => found[field])
    fieldRefs[first]?.focus()
    return
  }

  const id = productId.value
  isSaving.value = true

  try {
    await products.save(id, values)

    if (id === productId.value) {
      fillFromConfirmed()
      savedMessage.value = 'Зміни підтверджено API. Вони діють до reload або виходу.'
    }
  } catch (cause) {
    // Скасоване чи застаріле збереження не є помилкою форми; чернетка лишається.
    if (!isAbortError(cause) && !(cause instanceof StaleOperationError) && id === productId.value)
      saveError.value = cause.status === 0
        ? 'Не вдалося зберегти: немає з’єднання. Чернетку збережено — повторіть пізніше.'
        : `Не вдалося зберегти (${cause.status ? `HTTP ${cause.status}` : cause.message}). Чернетку збережено.`
  } finally {
    isSaving.value = false
  }
}

// «Скасувати зміни» відновлює поточні підтверджені значення без HTTP-запиту.
function cancelChanges() {
  fillFromConfirmed()
  saveError.value = ''
  savedMessage.value = ''
}

function confirmDiscard() {
  // Після завершення сеансу чернетка не утримує редактор.
  if (!auth.isAuthenticated || !isDirty.value)
    return true

  return window.confirm('Є незбережені зміни. Залишити редактор і втратити чернетку?')
}

onBeforeRouteLeave(() => confirmDiscard())
onBeforeRouteUpdate((to, from) => (to.params.id === from.params.id ? true : confirmDiscard()))

// Reload або закриття документа: вигляд попередження визначає браузер.
function onBeforeUnload(event) {
  if (auth.isAuthenticated && isDirty.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

const priceFormatter = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
</script>

<template>
  <section class="editor" aria-labelledby="editor-title">
    <Breadcrumbs :items="breadcrumbs" />

    <div v-if="isInvalidId || isNotFound" class="catalog__message editor__message">
      <p class="catalog__message-index">404 / PRODUCT</p>
      <h1 id="editor-title" class="catalog__message-title">Товар не знайдено</h1>
      <p class="catalog__message-text">
        <template v-if="isInvalidId">Ідентифікатор «{{ route.params.id }}» некоректний — запит не виконувався.</template>
        <template v-else>Товару №{{ route.params.id }} немає в API.</template>
      </p>
      <RouterLink class="catalog__retry manage__action" :to="{ name: 'manage-products' }">До списку товарів</RouterLink>
    </div>

    <div v-else-if="error" class="catalog__message catalog__message--error editor__message" role="alert">
      <p class="catalog__message-index">ERR / {{ error.status || 'NETWORK' }}</p>
      <h1 id="editor-title" class="catalog__message-title">Товар недоступний</h1>
      <p class="catalog__message-text">{{ error.message }}</p>
      <button class="catalog__retry manage__action" type="button" @click="refetch">Повторити запит</button>
    </div>

    <div v-else-if="isLoading || !confirmed" class="product-page__loading" aria-live="polite">
      <div class="catalog__skeleton editor__skeleton" aria-hidden="true"></div>
      <p class="product-page__loading-text">Завантажуємо товар №{{ route.params.id }}…</p>
    </div>

    <div v-else class="editor__layout">
      <aside class="editor__summary" aria-label="Підтверджені значення">
        <img class="editor__image" :src="confirmed.thumbnail" alt="" width="320" height="240" />
        <p class="editor__label">Підтверджено · ID {{ confirmed.id }}</p>
        <p class="editor__current-title">{{ confirmed.title }}</p>
        <dl class="editor__facts">
          <div><dt class="editor__label">Ціна</dt><dd class="editor__fact">{{ priceFormatter.format(confirmed.price) }}</dd></div>
          <div><dt class="editor__label">Залишок</dt><dd class="editor__fact">{{ confirmed.stock }}</dd></div>
        </dl>
        <RouterLink class="editor__public-link" :to="{ name: 'product-overview', params: { id: String(confirmed.id) } }">
          Публічна сторінка товару
        </RouterLink>
      </aside>

      <form class="editor__form" novalidate @submit.prevent="save">
        <h1 id="editor-title" class="editor__title">Редагування товару №{{ confirmed.id }}</h1>
        <p class="editor__state" aria-live="polite">
          <span class="editor__dot" :class="{ 'editor__dot--dirty': isDirty }" aria-hidden="true"></span>
          {{ isSaving ? 'Зберігаємо…' : isDirty ? 'Є незбережені зміни' : 'Чернетка збігається з підтвердженими даними' }}
        </p>

        <fieldset class="editor__fields" :disabled="isSaving">
          <legend class="editor__legend">Редаговані поля</legend>

          <div class="field">
            <label class="field__label" for="edit-title">Назва</label>
            <input
              id="edit-title"
              :ref="(el) => { fieldRefs.title = el }"
              v-model="draft.title"
              class="field__input"
              type="text"
              :aria-invalid="Boolean(errors.title)"
              :aria-describedby="describedBy('title')"
            />
            <p id="edit-title-hint" class="field__hint">1–{{ TITLE_MAX }} символів після обрізання пробілів.</p>
            <p v-if="errors.title" id="edit-title-error" class="field__error">{{ errors.title }}</p>
          </div>

          <div class="editor__row">
            <div class="field">
              <label class="field__label" for="edit-price">Ціна, USD</label>
              <input
                id="edit-price"
                :ref="(el) => { fieldRefs.price = el }"
                v-model="draft.price"
                class="field__input"
                type="text"
                inputmode="decimal"
                :aria-invalid="Boolean(errors.price)"
                :aria-describedby="describedBy('price')"
              />
              <p id="edit-price-hint" class="field__hint">Додатне число, наприклад 12.5.</p>
              <p v-if="errors.price" id="edit-price-error" class="field__error">{{ errors.price }}</p>
            </div>

            <div class="field">
              <label class="field__label" for="edit-stock">Залишок, шт.</label>
              <input
                id="edit-stock"
                :ref="(el) => { fieldRefs.stock = el }"
                v-model="draft.stock"
                class="field__input"
                type="text"
                inputmode="numeric"
                :aria-invalid="Boolean(errors.stock)"
                :aria-describedby="describedBy('stock')"
              />
              <p id="edit-stock-hint" class="field__hint">Ціле число від 0.</p>
              <p v-if="errors.stock" id="edit-stock-error" class="field__error">{{ errors.stock }}</p>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="edit-description">Опис</label>
            <textarea
              id="edit-description"
              :ref="(el) => { fieldRefs.description = el }"
              v-model="draft.description"
              class="field__input field__input--area"
              rows="6"
              :aria-invalid="Boolean(errors.description)"
              :aria-describedby="describedBy('description')"
            ></textarea>
            <p id="edit-description-hint" class="field__hint">
              1–{{ DESCRIPTION_MAX }} символів · зараз {{ draft.description.trim().length }}.
            </p>
            <p v-if="errors.description" id="edit-description-error" class="field__error">{{ errors.description }}</p>
          </div>
        </fieldset>

        <p v-if="saveError" class="editor__feedback editor__feedback--error" role="alert">{{ saveError }}</p>
        <p v-else-if="savedMessage" class="editor__feedback editor__feedback--success" role="status">{{ savedMessage }}</p>

        <div class="editor__actions">
          <button class="manage__action editor__save" type="submit" :disabled="isSaving" :aria-busy="isSaving">
            <span v-if="isSaving" class="login__spinner" aria-hidden="true"></span>
            {{ isSaving ? 'Зберігаємо…' : 'Зберегти' }}
          </button>
          <button
            class="manage__action editor__cancel"
            type="button"
            :disabled="isSaving || !isDirty"
            @click="cancelChanges"
          >
            Скасувати зміни
          </button>
          <RouterLink class="manage__action editor__back" :to="{ name: 'manage-products' }">До списку</RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>
