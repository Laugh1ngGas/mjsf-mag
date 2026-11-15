<script setup>
import { ref } from 'vue'
import ModalDialog from '../ModalDialog.vue'

defineProps({
  heading: { type: String, default: 'Середовище розробки' },
  environment: {
    type: Object,
    default: () => ({
      'Операційна система': 'Windows 11',
      Браузер: 'Google Chrome',
      'Node.js': '25.1.0',
      npm: '11.15.0',
      Vue: '3.5.45',
      Vite: '8.3.8',
      'Tailwind CSS': '3.4.17',
    }),
  },
  isActive: { type: Boolean, default: false },
})

const isDialogOpen = ref(false)
const openedCount = ref(0)
const verified = ref(false)
const closeButton = ref(null)

function openDialog() {
  openedCount.value += 1
  isDialogOpen.value = true
}
</script>

<template>
  <div class="environment">
    <h3 class="environment__title">{{ heading }}</h3>

    <p class="environment__text">
      Node.js {{ environment['Node.js'] }}, Vue {{ environment.Vue }}, Vite {{ environment.Vite }}.
      Повні відомості — у діалоговому вікні.
    </p>

    <label class="environment__check">
      <input v-model="verified" type="checkbox" name="verified" class="environment__box" />
      <span class="environment__label">Середовище перевірено</span>
    </label>

    <div class="environment__actions">
      <button type="button" class="environment__button" @click="openDialog">
        Відкрити відомості про середовище
      </button>
      <span class="environment__meta">Діалог відкривали: {{ openedCount }}</span>
    </div>

    <ModalDialog
      v-model="isDialogOpen"
      title="Відомості про середовище"
      :initial-focus="closeButton"
    >
      <dl class="environment__list">
        <div v-for="(value, key) in environment" :key="key" class="environment__row">
          <dt class="environment__term">{{ key }}</dt>
          <dd class="environment__value">{{ value }}</dd>
        </div>
      </dl>

      <template #footer>
        <button
          ref="closeButton"
          type="button"
          class="environment__button"
          @click="isDialogOpen = false"
        >
          Закрити
        </button>
      </template>
    </ModalDialog>
  </div>
</template>

<style scoped lang="scss">
.environment {
  @apply flex flex-col gap-3;

  &__title {
    @apply font-display text-base font-bold text-ink;
  }

  &__text {
    @apply text-sm leading-relaxed text-ink;
  }

  &__check {
    @apply flex min-h-11 cursor-pointer items-center gap-3 self-start rounded-lg px-2 hover:bg-surface;
  }

  &__box {
    @apply h-5 w-5 shrink-0 accent-ink;
  }

  &__label {
    @apply text-sm text-ink;
  }

  &__actions {
    @apply flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center;
  }

  &__button {
    @apply min-h-11 cursor-pointer rounded-lg bg-ink px-4 font-body text-sm font-semibold text-paper hover:bg-deep;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2;
  }

  &__meta {
    @apply text-xs text-muted;
  }

  &__list {
    @apply m-0 flex flex-col;
  }

  &__row {
    @apply flex flex-wrap justify-between gap-x-4 border-b border-edge py-2;
  }

  &__term {
    @apply text-muted;
  }

  &__value {
    @apply m-0 font-semibold text-ink;
  }
}
</style>
