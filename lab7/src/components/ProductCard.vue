<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProductsStore } from '../stores/products.js'

const props = defineProps({
  product: { type: Object, required: true },
})

const route = useRoute()
const products = useProductsStore()

// Уже завантажена картка показує підтверджені зміни поточного сеансу.
const shown = computed(() => products.withChanges(props.product))
const isChanged = computed(() => products.isChanged(props.product.id))

// Посилання на товар зберігає поточний пошук q.
const productLink = computed(() => ({
  name: 'product-overview',
  params: { id: String(shown.value.id) },
  query: typeof route.query.q === 'string' && route.query.q ? { q: route.query.q } : {},
}))

const priceFormatter = new Intl.NumberFormat('uk-UA', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const price = computed(() => priceFormatter.format(shown.value.price))
const stock = computed(() =>
  shown.value.stock > 0 ? `У наявності · ${shown.value.stock}` : 'Немає в наявності',
)
</script>

<template>
  <article class="product-card">
    <div class="product-card__visual">
      <span v-if="shown.discountPercentage >= 10" class="product-card__discount">
        −{{ Math.round(shown.discountPercentage) }}%
      </span>
      <img
        class="product-card__image"
        :src="shown.thumbnail"
        :alt="shown.title"
        loading="lazy"
        width="420"
        height="320"
      />
    </div>

    <div class="product-card__body">
      <div class="product-card__meta">
        <span class="product-card__category">{{ shown.category }}</span>
        <span v-if="isChanged" class="product-card__changed">змінено в сеансі</span>
        <span class="product-card__rating">{{ shown.rating.toFixed(1) }} / 5</span>
      </div>

      <h2 class="product-card__title">
        <RouterLink class="product-card__link" :to="productLink">{{ shown.title }}</RouterLink>
      </h2>
      <p class="product-card__description">{{ shown.description }}</p>

      <div class="product-card__footer">
        <strong class="product-card__price">{{ price }}</strong>
        <span class="product-card__stock">{{ stock }}</span>
      </div>
    </div>
  </article>
</template>
