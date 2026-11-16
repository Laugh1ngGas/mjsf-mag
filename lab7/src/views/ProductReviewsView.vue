<script setup>
import { computed } from 'vue'

const props = defineProps({
  product: { type: Object, required: true },
})

const dateFormatter = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' })
const reviews = computed(() =>
  (props.product.reviews ?? []).map((review) => ({
    ...review,
    formattedDate: review.date ? dateFormatter.format(new Date(review.date)) : '',
  })),
)
</script>

<template>
  <section class="product-reviews" aria-labelledby="product-reviews-title">
    <h2 id="product-reviews-title" class="product-details__title">Відгуки</h2>

    <ul v-if="reviews.length" class="product-reviews__list">
      <li v-for="(review, index) in reviews" :key="index" class="product-reviews__item">
        <div class="product-reviews__meta">
          <strong class="product-reviews__author">{{ review.reviewerName }}</strong>
          <span class="product-reviews__rating" :aria-label="`Оцінка ${review.rating} з 5`">
            {{ review.rating }} / 5
          </span>
        </div>
        <p class="product-reviews__comment">{{ review.comment }}</p>
        <time class="product-reviews__date" :datetime="review.date">{{ review.formattedDate }}</time>
      </li>
    </ul>

    <p v-else class="product-reviews__empty">Для цього товару ще немає відгуків.</p>
  </section>
</template>
