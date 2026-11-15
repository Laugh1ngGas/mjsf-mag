<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  // DOM-елементи з батьківського компонента; до появи можуть бути null.
  initialFocus: { type: HTMLElement, default: null },
  fallbackFocus: { type: HTMLElement, default: null },
})

const emit = defineEmits(['update:modelValue'])

// Унікальний id заголовка для aria-labelledby панелі.
const titleId = useId()

// Шаблонний ref панелі.
const panel = ref(null)
// Vue обнуляє шаблонний ref одразу після закриття, хоча панель ще
// лишається в DOM до завершення анімації, тому зберігаємо й сам елемент.
let lastPanelElement = null

// Стан, який потрібно відновити після закриття.
let triggerElement = null
let backgroundLocked = false
let savedAppInert = false
let savedBodyOverflow = ''
let pressedOnBackdrop = false

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'summary',
  '[contenteditable="true"]',
  '[tabindex]',
].join(',')

function isVisible(element) {
  return element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden'
}

function canFocus(element) {
  return Boolean(
    element &&
      element.isConnected &&
      !element.disabled &&
      !element.closest('[inert]') &&
      isVisible(element),
  )
}

// Актуальний перелік видимих доступних для Tab елементів панелі.
function getTabbableElements() {
  if (!panel.value) {
    return []
  }

  return [...panel.value.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) => element.tabIndex >= 0 && canFocus(element),
  )
}

function isInsideDialog(element) {
  return Boolean(
    element &&
      (panel.value?.contains(element) || lastPanelElement?.contains(element)),
  )
}

function focusInside() {
  lastPanelElement = panel.value

  if (canFocus(props.initialFocus) && panel.value?.contains(props.initialFocus)) {
    props.initialFocus.focus()
  } else {
    panel.value?.focus()
  }
}

function lockBackground() {
  if (backgroundLocked) {
    return
  }

  const app = document.getElementById('app')
  savedAppInert = app?.inert ?? false
  savedBodyOverflow = document.body.style.overflow

  if (app) {
    app.inert = true
  }
  document.body.style.overflow = 'hidden'
  backgroundLocked = true
}

function restoreBackground() {
  if (!backgroundLocked) {
    return
  }

  const app = document.getElementById('app')

  if (app) {
    app.inert = savedAppInert
  }
  document.body.style.overflow = savedBodyOverflow
  backgroundLocked = false
}

function restoreFocus() {
  const target = canFocus(triggerElement) ? triggerElement : props.fallbackFocus

  triggerElement = null

  if (canFocus(target)) {
    target.focus()
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (!isOpen) {
      return
    }

    // Елемент виклику запам'ятовується до оновлення DOM.
    const active = document.activeElement

    if (active && active !== document.body && !isInsideDialog(active)) {
      triggerElement = active
    }

    await nextTick()

    if (!props.modelValue) {
      return
    }

    focusInside()
    lockBackground()
  },
  { immediate: true },
)

function onAfterEnter() {
  // Після завершення появи уточнюємо фокус, якщо ціль стала доступною.
  const active = document.activeElement

  if (active === panel.value || !panel.value?.contains(active)) {
    focusInside()
  }
}

function cleanup() {
  // Вікно могли повторно відкрити, поки тривало зникнення.
  if (props.modelValue) {
    return
  }

  restoreBackground()
  restoreFocus()
}

onBeforeUnmount(() => {
  restoreBackground()

  if (triggerElement) {
    restoreFocus()
  }
})

function close() {
  emit('update:modelValue', false)
}

function trapTab(event) {
  const elements = getTabbableElements()

  if (!elements.length) {
    event.preventDefault()
    panel.value?.focus()
    return
  }

  const first = elements[0]
  const last = elements[elements.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  } else if (!panel.value.contains(active)) {
    event.preventDefault()
    first.focus()
  }
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Tab') {
    trapTab(event)
  }
}

function onBackdropMousedown() {
  pressedOnBackdrop = true
}

function onPanelMousedown() {
  pressedOnBackdrop = false
}

function onBackdropClick() {
  // Закриваємо лише тоді, коли натискання почалося й завершилося на підкладці.
  if (pressedOnBackdrop) {
    close()
  }
  pressedOnBackdrop = false
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity duration-150 motion-reduce:transition-none"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
      leave-to-class="opacity-0"
      @after-enter="onAfterEnter"
      @after-leave="cleanup"
    >
      <div
        v-if="modelValue"
        class="modal-backdrop fixed inset-0 z-50 box-border flex items-center justify-center bg-slate-900/60 p-4"
        @mousedown.self="onBackdropMousedown"
        @click.self="onBackdropClick"
      >
        <div
          ref="panel"
          tabindex="-1"
          class="box-border w-full max-w-screen-sm max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden rounded-xl bg-white text-slate-900 shadow-2xl"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          @mousedown="onPanelMousedown"
          @keydown="onKeydown"
        >
          <header class="shrink-0 flex items-start justify-between gap-3 border-b border-slate-200 p-4">
            <h2 :id="titleId" class="m-0 min-w-0 break-words text-lg font-semibold">
              {{ title }}
            </h2>
            <button
              type="button"
              class="shrink-0 min-h-11 min-w-11 cursor-pointer rounded-lg border-0 bg-transparent text-2xl leading-none text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label="Закрити вікно"
              @click="close"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div class="min-h-0 overflow-y-auto break-words p-4">
            <slot />
          </div>

          <footer class="shrink-0 flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
            <slot name="footer" :close="close" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
