<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: { type: Number, default: null },
  title: { type: String, required: true },
  topic: { type: String, required: true },
  description: { type: String, required: true },
  minutes: { type: Number, required: true },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'edit', 'delete'])

const topicLabels = {
  vue: 'Vue',
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
}

const topicLabel = computed(() => topicLabels[props.topic] ?? props.topic)
const number = computed(() =>
  props.id === null ? '' : String(props.id).padStart(2, '0'),
)
</script>

<template>
  <article
    class="material-card"
    :class="[
      `material-card--${topic}`,
      { 'material-card--selected': selected },
    ]"
  >
    <div class="material-card__meta">
      <span class="material-card__number">{{ number }}</span>
      <span class="material-card__topic">{{ topicLabel }}</span>
    </div>
    <h3 class="material-card__title">{{ title }}</h3>
    <p class="material-card__description">
      {{ description }}
    </p>
    <div class="material-card__footer">
      <span class="material-card__duration">{{ minutes }} хв</span>
      <button
        class="material-card__action"
        type="button"
        :aria-pressed="selected"
        @click="emit('select', title)"
      >
        {{ selected ? 'Обрано' : 'Обрати' }}
      </button>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        class="min-h-11 min-w-11 flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        :aria-label="`Редагувати: ${title}`"
        @click="emit('edit')"
      >
        Редагувати
      </button>
      <button
        type="button"
        class="min-h-11 min-w-11 flex-1 cursor-pointer rounded-lg border border-red-300 bg-white px-3 font-semibold text-red-700 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        :aria-label="`Видалити: ${title}`"
        @click="emit('delete')"
      >
        Видалити
      </button>
    </div>
  </article>
</template>
