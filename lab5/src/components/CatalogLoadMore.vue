<script setup>
import { ref, watch } from 'vue'
import { useIntersectionObserver } from '../composables/useIntersectionObserver.js'

const props = defineProps({
  loaded: { type: Number, required: true },
  total: { type: Number, required: true },
  isLoading: { type: Boolean, default: false },
  error: { type: Object, default: null },
  hasMore: { type: Boolean, default: false },
})

const emit = defineEmits(['load-more', 'retry'])

const marker = ref(null)

const { refresh } = useIntersectionObserver(marker, () => emit('load-more'), {
  rootMargin: '280px 0px',
  threshold: 0.01,
})

// Observer повідомляє лише про зміну перетину. Після завантаження й оновлення DOM
// перевіряємо маркер заново: якщо він усе ще поруч із viewport, прийде новий callback.
watch(
  () => props.isLoading,
  (loading) => {
    if (!loading)
      refresh()
  },
  { flush: 'post' },
)
</script>

<template>
  <div ref="marker" class="catalog__load-more" aria-live="polite">
    <span class="catalog__load-progress">{{ loaded }} / {{ total }}</span>

    <div v-if="isLoading" class="catalog__load-copy">
      <span class="catalog__load-spinner" aria-hidden="true"></span>
      <strong class="catalog__load-title">Завантажуємо наступні товари</strong>
      <span class="catalog__load-text">Уже показані картки залишаються на місці</span>
    </div>

    <div v-else-if="error" class="catalog__load-copy catalog__load-copy--static">
      <strong class="catalog__load-title">Не вдалося отримати сторінку</strong>
      <span class="catalog__load-text">{{ error.message }}</span>
      <button class="catalog__load-button" type="button" @click="emit('retry')">
        Повторити запит
      </button>
    </div>

    <div v-else-if="hasMore" class="catalog__load-copy catalog__load-copy--static">
      <strong class="catalog__load-title">Прокрутіть нижче</strong>
      <span class="catalog__load-text">
        Наступні товари завантажаться автоматично
      </span>
    </div>

    <div v-else class="catalog__load-copy catalog__load-copy--static">
      <strong class="catalog__load-title">Усі товари завантажено</strong>
      <span class="catalog__load-text">Більше результатів за цим запитом немає</span>
    </div>
  </div>
</template>
