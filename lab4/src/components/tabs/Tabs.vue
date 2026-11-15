<script setup>
import { computed, nextTick, onBeforeUnmount, provide, ref, useAttrs, useId } from 'vue'
import { tabsKey } from './tabsKey.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, required: true },
  variant: {
    type: String,
    default: 'underline',
    validator: (value) => ['underline', 'pills', 'boxed'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])
const attrs = useAttrs()
const tabs = ref([])
const activeSlug = computed(() => props.modelValue)
const idPrefix = useId()
const variantClasses = {
  underline: 'tabs--underline',
  pills: 'tabs--pills',
  boxed: 'tabs--boxed',
}

const variantClass = computed(() => variantClasses[props.variant])

// aria-label, переданий на <Tabs>, стає доступною назвою tablist; решта атрибутів — на корінь.
const rootAttrs = computed(() => {
  const { 'aria-label': _label, ...rest } = attrs
  return rest
})
const listLabel = computed(() => attrs['aria-label'] ?? 'Вкладки')

const enabledTabs = computed(() => tabs.value.filter((tab) => !tab.disabled))

// Roving tabindex: у послідовність Tab входить лише активна (або перша доступна) вкладка.
const focusableSlug = computed(() =>
  enabledTabs.value.some((tab) => tab.slug === props.modelValue)
    ? props.modelValue
    : enabledTabs.value[0]?.slug,
)

const tabId = (slug) => `${idPrefix}-tab-${slug}`
const panelId = (slug) => `${idPrefix}-panel-${slug}`

const buttons = new Map()

function setButtonRef(slug, element) {
  if (element) {
    buttons.set(slug, element)
  } else {
    buttons.delete(slug)
  }
}

let isUnmounting = false

function findTab(slug) {
  return tabs.value.find((tab) => tab.slug === slug)
}

function setActiveTab(slug) {
  const tab = findTab(slug)

  if (!tab || tab.disabled || slug === props.modelValue) {
    return
  }

  emit('update:modelValue', slug)
}

function registerTab(tab) {
  if (findTab(tab.slug)) {
    throw new Error(
      `[Tabs] Вкладка зі slug "${tab.slug}" уже зареєстрована в цьому наборі. ` +
        'Значення slug мають бути унікальними.',
    )
  }

  tabs.value.push(tab)
}

function unregisterTab(slug) {
  tabs.value = tabs.value.filter((tab) => tab.slug !== slug)

  if (!isUnmounting && slug === props.modelValue) {
    const firstAvailable = tabs.value.find((tab) => !tab.disabled)

    if (firstAvailable) {
      emit('update:modelValue', firstAvailable.slug)
    }
  }
}

async function activateAndFocus(slug) {
  setActiveTab(slug)
  await nextTick()
  buttons.get(slug)?.focus()
}

function onKeydown(event) {
  const list = enabledTabs.value

  if (!list.length) {
    return
  }

  const current = list.findIndex((tab) => tab.slug === event.target.dataset.slug)
  let next

  switch (event.key) {
    case 'ArrowRight':
      next = (current + 1) % list.length
      break
    case 'ArrowLeft':
      next = (current - 1 + list.length) % list.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = list.length - 1
      break
    default:
      return
  }

  event.preventDefault()
  activateAndFocus(list[next].slug)
}

onBeforeUnmount(() => {
  isUnmounting = true
})

provide(tabsKey, {
  activeSlug,
  idPrefix,
  setActiveTab,
  registerTab,
  unregisterTab,
})
</script>

<template>
  <div class="tabs" :class="variantClass" v-bind="rootAttrs">
    <div
      class="tabs__list"
      role="tablist"
      :aria-label="listLabel"
      @keydown="onKeydown"
    >
      <button
        v-for="tab in tabs"
        :id="tabId(tab.slug)"
        :key="tab.slug"
        :ref="(element) => setButtonRef(tab.slug, element)"
        type="button"
        role="tab"
        class="tabs__tab"
        :class="{ 'tabs__tab--active': tab.slug === activeSlug }"
        :aria-selected="tab.slug === activeSlug ? 'true' : 'false'"
        :aria-controls="panelId(tab.slug)"
        :tabindex="tab.slug === focusableSlug ? 0 : -1"
        :disabled="tab.disabled"
        :data-slug="tab.slug"
        @click="setActiveTab(tab.slug)"
      >
        <span class="tabs__label">{{ tab.title }}</span>
      </button>
    </div>

    <slot />
  </div>
</template>

<style scoped lang="scss">
.tabs {
  $self: &;

  @apply overflow-hidden rounded-xl border border-edge bg-paper;
  &__list {
    @apply flex flex-wrap gap-x-1 px-2;
  }

  &__tab {
    @apply flex min-h-11 cursor-pointer items-center px-4 py-2 font-body text-sm font-semibold text-muted;
    @apply transition-colors hover:text-ink;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink;

    &:disabled {
      @apply cursor-not-allowed opacity-50 hover:text-muted;
    }
  }

  &__label {
    @apply whitespace-nowrap;
  }

  &--underline {
    #{$self}__list {
      @apply border-b-2 border-edge;
    }

    #{$self}__tab {
      @apply -mb-0.5 border-b-2 border-transparent;
    }

    #{$self}__tab--active {
      @apply border-accent text-ink;
    }
  }

  &--pills {
    #{$self}__list {
      @apply gap-2 border-b border-edge p-2;
    }

    #{$self}__tab {
      @apply rounded-full hover:bg-surface;
    }

    #{$self}__tab--active {
      @apply bg-ink text-paper hover:bg-ink hover:text-paper;
    }
  }

  &--boxed {
    #{$self}__list {
      @apply gap-1 border-b border-edge bg-surface px-2 pt-2;
    }

    #{$self}__tab {
      @apply -mb-px rounded-t-lg border border-transparent;
    }

    #{$self}__tab--active {
      @apply border-edge border-b-paper bg-paper text-ink;
    }
  }
}
</style>
