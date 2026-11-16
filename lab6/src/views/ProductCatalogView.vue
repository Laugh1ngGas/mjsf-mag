<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import CatalogLoadMore from '../components/CatalogLoadMore.vue'
import ProductCatalog from '../components/ProductCatalog.vue'
import ProductSearchForm from '../components/ProductSearchForm.vue'
import { API_DELAY, PAGE_SIZE, createProductsUrl } from '../api/products.js'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'
import { useDebouncedValue } from '../composables/useDebouncedValue.js'
import { useFetch } from '../composables/useFetch.js'

const route = useRoute()
const router = useRouter()
const breadcrumbs = useBreadcrumbs()

// q в адресі — підтверджена умова пошуку; поле — локальна чернетка введення.
const confirmedQuery = computed(() =>
  typeof route.query.q === 'string' ? route.query.q.trim() : '',
)
const draft = ref(confirmedQuery.value)

// Новий об’єкт позначає завершене редагування, навіть якщо рядок не змінився.
const debouncedEdit = useDebouncedValue(() => ({ query: draft.value }), 400)
const hasPendingEdit = ref(false)
const isEditing = computed(() =>
  hasPendingEdit.value || draft.value.trim() !== confirmedQuery.value,
)

const skip = ref(0)
const products = ref([])
const total = ref(0)

const requestUrl = computed(() => createProductsUrl(confirmedQuery.value, skip.value))
const { data, error, isLoading, abort, refetch } = useFetch(requestUrl)

const hasMore = computed(() => products.value.length < total.value)
const isPending = computed(() => isLoading.value || isEditing.value)
const catalogTitle = computed(() =>
  confirmedQuery.value ? `Пошук: «${confirmedQuery.value}»` : 'Початкова добірка',
)

let restoring = false
let abortedUrl = null

// Кожна зміна чернетки користувачем негайно скасовує активний запит.
watch(
  draft,
  () => {
    if (restoring)
      return

    hasPendingEdit.value = true

    if (isLoading.value) {
      abortedUrl = requestUrl.value
      abort()
    }
  },
  { flush: 'sync' },
)

// Після паузи 400 мс: новий рядок записується в URL, той самий — повторює скасований запит.
watch(debouncedEdit, (edit) => {
  hasPendingEdit.value = false
  const next = edit.query.trim()

  if (next !== confirmedQuery.value) {
    abortedUrl = null
    router.replace({ name: 'products', query: next ? { q: next } : {} })
    return
  }

  if (abortedUrl && abortedUrl === requestUrl.value)
    refetch()

  abortedUrl = null
})

// Зміна підтвердженого пошуку (введення, посилання, «Назад»/«Вперед») починає першу сторінку.
watch(
  confirmedQuery,
  (query) => {
    skip.value = 0
    products.value = []
    total.value = 0

    // Відновлення поля з URL не є новим введенням і не записується назад.
    if (draft.value.trim() !== query) {
      restoring = true
      draft.value = query
      restoring = false
    }
  },
  { flush: 'sync' },
)

// Сторінка skip=0 замінює список, наступні додаються без повторення id.
watch(data, (page) => {
  if (!page)
    return

  if (page.skip === 0) {
    products.value = page.products
  } else {
    const known = new Set(products.value.map((product) => product.id))
    products.value = [
      ...products.value,
      ...page.products.filter((product) => !known.has(product.id)),
    ]
  }

  total.value = page.total
})

function loadMore() {
  if (!hasMore.value || isLoading.value || isEditing.value || error.value)
    return

  skip.value += PAGE_SIZE
}
</script>

<template>
  <div class="catalog-page">
    <Breadcrumbs :items="breadcrumbs" />

    <section class="storefront__hero">
      <div class="storefront__intro">
        <p class="storefront__eyebrow">Vue Router · DummyJSON</p>
        <h1 class="storefront__title">
          Речі з ясною
          <em class="storefront__title-accent">формою</em>
        </h1>
      </div>

      <ProductSearchForm
        v-model="draft"
        :is-loading="isLoading"
        :is-debouncing="isEditing"
        :error="error"
        :loaded="products.length"
        :total="total"
        :delay="API_DELAY"
      />
    </section>

    <section class="catalog" aria-labelledby="catalog-title">
      <div class="catalog__heading">
        <h2 id="catalog-title" class="catalog__title">{{ catalogTitle }}</h2>
        <span class="catalog__count">{{ products.length.toString().padStart(2, '0') }}</span>
      </div>

      <ProductCatalog
        :products="products"
        :is-loading="isPending"
        :error="error"
        @retry="refetch"
      />

      <CatalogLoadMore
        v-if="products.length"
        :loaded="products.length"
        :total="total"
        :is-loading="isLoading"
        :error="error"
        :has-more="hasMore"
        @load-more="loadMore"
        @retry="refetch"
      />
    </section>
  </div>
</template>
