<script setup>
import { computed, ref, watch } from 'vue'
import CatalogLoadMore from './components/CatalogLoadMore.vue'
import ProductCatalog from './components/ProductCatalog.vue'
import ProductSearchForm from './components/ProductSearchForm.vue'
import { API_DELAY, PAGE_SIZE, createProductsUrl } from './api/products.js'
import { useDebouncedValue } from './composables/useDebouncedValue.js'
import { useFetch } from './composables/useFetch.js'

const query = ref('')
const debouncedQuery = useDebouncedValue(query, 400)
const searchTerm = computed(() => debouncedQuery.value.trim())
const isDebouncing = computed(() => query.value !== debouncedQuery.value)

const skip = ref(0)
const products = ref([])
const total = ref(0)

const requestUrl = computed(() => createProductsUrl(searchTerm.value, skip.value))
const { data, error, isLoading, abort, refetch } = useFetch(requestUrl)

const hasMore = computed(() => products.value.length < total.value)
const isPending = computed(() => isLoading.value || isDebouncing.value)
const catalogTitle = computed(() =>
  searchTerm.value ? `Пошук: «${searchTerm.value}»` : 'Початкова добірка',
)

// Сирий рядок негайно скасовує активний запит — ще до завершення debounce.
let abortedUrl = null

watch(
  query,
  () => {
    if (isLoading.value) {
      abortedUrl = requestUrl.value
      abort()
    }
  },
  { flush: 'sync' },
)

// Якщо після паузи URL не змінився (рядок повернули до попереднього),
// скасований запит потрібно повторити.
watch(isDebouncing, (debouncing) => {
  if (debouncing)
    return

  if (abortedUrl && abortedUrl === requestUrl.value)
    refetch()

  abortedUrl = null
})

// Новий пошуковий рядок починає видачу з першої сторінки.
watch(
  searchTerm,
  () => {
    skip.value = 0
    products.value = []
    total.value = 0
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
  if (!hasMore.value || isLoading.value || isDebouncing.value || error.value)
    return

  skip.value += PAGE_SIZE
}
</script>

<template>
  <main class="storefront">
    <header class="storefront__masthead">
      <a class="storefront__brand" href="#" aria-label="Forma, на початок">
        FORMA<span class="storefront__brand-mark">®</span>
      </a>
      <p class="storefront__edition">Лабораторна / 05</p>
      <p class="storefront__note">Бойчук Б.Е. · 7.F2.25-2 · Windows 11 · Chrome · Node.js 25.1.0</p>
    </header>

    <section class="storefront__hero">
      <div class="storefront__intro">
        <p class="storefront__eyebrow">Composables · DummyJSON</p>
        <h1 class="storefront__title">
          Речі з ясною
          <em class="storefront__title-accent">формою</em>
        </h1>
      </div>

      <ProductSearchForm
        v-model="query"
        :is-loading="isLoading"
        :is-debouncing="isDebouncing"
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

    <footer class="storefront__footer">
      <p>Студент: Бойчук Богдан Едуардович · група 7.F2.25-2</p>
      <p>Середовище: Windows 11 · Chrome · Node.js 25.1.0 · Vue 3.5</p>
      <a href="https://dummyjson.com/docs/products" target="_blank" rel="noreferrer">
        Дані: DummyJSON
      </a>
    </footer>
  </main>
</template>
