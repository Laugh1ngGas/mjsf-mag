<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { PAGE_SIZE } from '../api/products.js'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'
import { usePrivateResource } from '../composables/usePrivateResource.js'
import { useProductsStore } from '../stores/products.js'

const route = useRoute()
const router = useRouter()
const products = useProductsStore()
const breadcrumbs = useBreadcrumbs()

// Номер сторінки береться з query.skip: reload і повернення після входу зберігають її.
const skip = computed(() => {
  const raw = route.query.skip
  return typeof raw === 'string' && /^\d+$/.test(raw) && Number(raw) % PAGE_SIZE === 0 ? Number(raw) : 0
})

const path = computed(() => {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String(skip.value),
    select: 'title,price,stock,thumbnail,category',
  })
  return `/auth/products?${params}`
})

const { data, error, isLoading, refetch } = usePrivateResource(path)

const rows = computed(() => (data.value?.products ?? []).map((item) => products.withChanges(item)))
const total = computed(() => data.value?.total ?? 0)
const page = computed(() => Math.floor(skip.value / PAGE_SIZE) + 1)
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const hasPrevious = computed(() => skip.value > 0)
const hasNext = computed(() => data.value !== null && skip.value + PAGE_SIZE < total.value)

function goTo(nextSkip) {
  // Поки триває запит, повторне перемикання заблоковане.
  if (isLoading.value)
    return

  router.push({ name: 'manage-products', query: nextSkip > 0 ? { skip: String(nextSkip) } : {} })
}

const priceFormatter = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
</script>

<template>
  <section class="manage-list" aria-labelledby="manage-list-title" :aria-busy="isLoading">
    <Breadcrumbs :items="breadcrumbs" />

    <div class="manage-list__heading">
      <h1 id="manage-list-title" class="manage-list__title">Товари для редагування</h1>
      <p class="manage-list__meta" aria-live="polite">
        <template v-if="isLoading">Завантаження сторінки {{ page }}…</template>
        <template v-else-if="data">Сторінка {{ page }} з {{ pageCount }} · {{ total }} товарів</template>
      </p>
    </div>

    <div v-if="error" class="catalog__message catalog__message--error manage-list__message" role="alert">
      <p class="catalog__message-index">ERR / {{ error.status || 'NETWORK' }}</p>
      <h2 class="catalog__message-title">Список недоступний</h2>
      <p class="catalog__message-text">{{ error.message }}</p>
      <button class="catalog__retry manage__action" type="button" @click="refetch">Повторити запит</button>
    </div>

    <div v-else-if="isLoading && !data" class="manage-list__skeleton" aria-hidden="true">
      <div v-for="item in 6" :key="item" class="manage-list__skeleton-row"></div>
    </div>

    <ul v-else class="manage-list__items" :class="{ 'manage-list__items--updating': isLoading }">
      <li v-for="item in rows" :key="item.id" class="manage-list__item">
        <img class="manage-list__thumb" :src="item.thumbnail" alt="" width="64" height="64" loading="lazy" />
        <div class="manage-list__info">
          <p class="manage-list__id">
            №{{ item.id }} · {{ item.category }}
            <span v-if="products.isChanged(item.id)" class="manage-list__badge">змінено в сеансі</span>
          </p>
          <h2 class="manage-list__name">{{ item.title }}</h2>
        </div>
        <dl class="manage-list__facts">
          <div class="manage-list__fact">
            <dt class="manage-list__label">Ціна</dt>
            <dd class="manage-list__value">{{ priceFormatter.format(item.price) }}</dd>
          </div>
          <div class="manage-list__fact">
            <dt class="manage-list__label">Залишок</dt>
            <dd class="manage-list__value">{{ item.stock }}</dd>
          </div>
        </dl>
        <RouterLink
          class="manage__action manage-list__edit"
          :to="{ name: 'manage-edit', params: { id: String(item.id) } }"
          :aria-label="`Редагувати: ${item.title}`"
        >
          Редагувати
        </RouterLink>
      </li>
    </ul>

    <nav class="manage-list__pager" aria-label="Сторінки списку">
      <button
        class="manage__action manage-list__page-button"
        type="button"
        :disabled="!hasPrevious || isLoading"
        @click="goTo(skip - PAGE_SIZE)"
      >
        ← Попередня
      </button>
      <span class="manage-list__page">{{ page }} / {{ pageCount }}</span>
      <button
        class="manage__action manage-list__page-button"
        type="button"
        :disabled="!hasNext || isLoading"
        @click="goTo(skip + PAGE_SIZE)"
      >
        Наступна →
      </button>
    </nav>
  </section>
</template>
