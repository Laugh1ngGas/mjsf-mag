<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  heading: { type: String, default: 'Вимоги до роботи' },
  items: {
    type: Array,
    default: () => [
      'Три набори вкладок: underline, pills і boxed',
      'Контекст tabsKey через provide/inject',
      'Клавіатурна навігація ArrowLeft, ArrowRight, Home, End',
      'Збереження стану панелей у KeepAlive',
      'ModalDialog із лабораторної роботи 3',
    ],
  },
})

const done = ref(props.items.map(() => false))
const doneCount = computed(() => done.value.filter(Boolean).length)
const allDone = computed(() => doneCount.value === props.items.length)

function markNext() {
  const index = done.value.indexOf(false)

  if (index !== -1) {
    done.value[index] = true
  }
}

function reset() {
  done.value = props.items.map(() => false)
}
</script>

<template>
  <div class="requirements">
    <h3 class="requirements__title">{{ heading }}</h3>

    <ul class="requirements__list">
      <li v-for="(item, index) in items" :key="item" class="requirements__item">
        <label class="requirements__check">
          <input
            v-model="done[index]"
            type="checkbox"
            :name="`requirement-${index + 1}`"
            class="requirements__box"
          />
          <span :class="{ 'requirements__text--done': done[index] }" class="requirements__text">
            {{ item }}
          </span>
        </label>
      </li>
    </ul>

    <div class="requirements__actions">
      <button type="button" class="requirements__button" :disabled="allDone" @click="markNext">
        Виконано: {{ doneCount }} з {{ items.length }} — позначити наступну
      </button>
      <button type="button" class="requirements__button requirements__button--ghost" @click="reset">
        Скинути
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.requirements {
  @apply flex flex-col gap-3;

  &__title {
    @apply font-display text-base font-bold text-ink;
  }

  &__list {
    @apply flex flex-col gap-1;
  }

  &__check {
    @apply flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 hover:bg-surface;
  }

  &__box {
    @apply h-5 w-5 shrink-0 accent-ink;
  }

  &__text {
    @apply text-sm text-ink;

    &--done {
      @apply text-muted line-through;
    }
  }

  &__actions {
    @apply flex flex-col gap-2 sm:flex-row sm:flex-wrap;
  }

  &__button {
    @apply min-h-11 cursor-pointer rounded-lg bg-ink px-4 font-body text-sm font-semibold text-paper hover:bg-deep;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2;
    @apply disabled:cursor-not-allowed disabled:opacity-50;

    &--ghost {
      @apply border border-edge bg-paper text-ink hover:bg-surface;
    }
  }
}
</style>
