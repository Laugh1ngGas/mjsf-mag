<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { createProductUrl, isValidProductId } from '../api/products.js'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'
import { useFetch } from '../composables/useFetch.js'

const route = useRoute()

const productId = computed(() => (isValidProductId(route.params.id) ? route.params.id : null))

// URL залежить лише від id: перемикання огляду й відгуків його не змінює.
const productUrl = computed(() => (productId.value ? createProductUrl(productId.value) : null))
const { data, error, isLoading, refetch } = useFetch(productUrl)

// Показуємо лише товар, що відповідає поточному id.
const product = computed(() =>
  data.value && String(data.value.id) === productId.value ? data.value : null,
)
const isNotFound = computed(() => !productId.value || error.value?.status === 404)

const productTitle = computed(() => {
  if (isNotFound.value)
    return 'Товар не знайдено'

  return product.value?.title ?? `Товар №${route.params.id}`
})
const breadcrumbs = useBreadcrumbs(productTitle)

const sectionQuery = computed(() =>
  typeof route.query.q === 'string' && route.query.q ? { q: route.query.q } : {},
)

const priceFormatter = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})
const price = computed(() => (product.value ? priceFormatter.format(product.value.price) : ''))
const stock = computed(() => {
  if (!product.value)
    return ''

  return product.value.stock > 0 ? `У наявності · ${product.value.stock}` : 'Немає в наявності'
})
</script>

<template>
  <div class="product-page">
    <Breadcrumbs :items="breadcrumbs" />

    <div v-if="isNotFound" class="catalog__message product-page__message">
      <p class="catalog__message-index">404 / PRODUCT</p>
      <h1 class="catalog__message-title">Товар не знайдено</h1>
      <p class="catalog__message-text">
        Товару з ідентифікатором «{{ route.params.id }}» немає в каталозі.
      </p>
      <RouterLink class="catalog__retry" :to="{ name: 'products', query: sectionQuery }">
        Повернутися до каталогу
      </RouterLink>
    </div>

    <div
      v-else-if="error"
      class="catalog__message catalog__message--error product-page__message"
      role="alert"
    >
      <p class="catalog__message-index">ERR / API</p>
      <h1 class="catalog__message-title">Не вдалося завантажити товар</h1>
      <p class="catalog__message-text">{{ error.message }}</p>
      <button class="catalog__retry" type="button" @click="refetch">Повторити запит</button>
    </div>

    <div v-else-if="isLoading || !product" class="product-page__loading" aria-live="polite">
      <div class="catalog__skeleton product-page__skeleton" aria-hidden="true"></div>
      <p class="product-page__loading-text">Завантажуємо товар №{{ route.params.id }}…</p>
    </div>

    <template v-else>
      <article class="product-page__summary">
        <div class="product-page__visual">
          <img
            class="product-page__image"
            :src="product.thumbnail"
            :alt="product.title"
            width="420"
            height="320"
          />
        </div>

        <div class="product-page__info">
          <p class="product-page__category">{{ product.category }} · {{ product.brand ?? 'без бренду' }}</p>
          <h1 class="product-page__title">{{ product.title }}</h1>
          <dl class="product-page__facts">
            <div class="product-page__fact">
              <dt class="product-page__fact-label">Ціна</dt>
              <dd class="product-page__fact-value product-page__fact-value--price">{{ price }}</dd>
            </div>
            <div class="product-page__fact">
              <dt class="product-page__fact-label">Рейтинг</dt>
              <dd class="product-page__fact-value">{{ product.rating.toFixed(1) }} / 5</dd>
            </div>
            <div class="product-page__fact">
              <dt class="product-page__fact-label">Наявність</dt>
              <dd class="product-page__fact-value">{{ stock }}</dd>
            </div>
          </dl>
        </div>
      </article>

      <nav class="product-page__sections" aria-label="Розділи товару">
        <RouterLink
          class="product-page__section-link"
          :to="{ name: 'product-overview', params: { id: route.params.id }, query: sectionQuery }"
        >
          Огляд
        </RouterLink>
        <RouterLink
          class="product-page__section-link"
          :to="{ name: 'product-reviews', params: { id: route.params.id }, query: sectionQuery }"
        >
          Відгуки · {{ product.reviews?.length ?? 0 }}
        </RouterLink>
      </nav>

      <RouterView v-slot="{ Component }">
        <component :is="Component" :product="product" />
      </RouterView>
    </template>
  </div>
</template>
