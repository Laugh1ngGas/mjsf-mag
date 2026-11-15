<script setup>
import { onActivated, ref } from 'vue'

defineProps({
  heading: { type: String, default: 'Огляд матеріалу' },
  isActive: { type: Boolean, default: false },
})

const note = ref('')
const activations = ref(0)

onActivated(() => {
  activations.value += 1
})
</script>

<template>
  <div class="overview">
    <div class="overview__head">
      <h3 class="overview__title">{{ heading }}</h3>
      <span v-if="isActive" class="overview__badge">isActive</span>
    </div>

    <p class="overview__text">
      Складений компонент вкладок: Tabs керує смугою кнопок і надає контекст, а кожен Tab
      реєструється в ньому та показує власну панель.
    </p>

    <label class="overview__field">
      <span class="overview__label">Нотатка</span>
      <textarea
        v-model="note"
        name="note"
        class="overview__input"
        rows="3"
        placeholder="Введіть довільний текст"
      ></textarea>
    </label>

    <p class="overview__meta">
      Символів: {{ note.length }} · Показів панелі (onActivated): {{ activations }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.overview {
  @apply flex flex-col gap-3;

  &__head {
    @apply flex flex-wrap items-center justify-between gap-2;
  }

  &__title {
    @apply font-display text-base font-bold text-ink;
  }

  &__badge {
    @apply rounded-full bg-surface px-2 py-0.5 font-mono text-xs text-muted;
  }

  &__text {
    @apply text-sm leading-relaxed text-ink;
  }

  &__field {
    @apply flex flex-col gap-1;
  }

  &__label {
    @apply text-sm font-semibold text-ink;
  }

  &__input {
    @apply box-border min-h-11 w-full resize-y rounded-lg border border-edge bg-paper p-3 font-body text-sm text-ink;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink;
  }

  &__meta {
    @apply text-xs text-muted;
  }
}
</style>
