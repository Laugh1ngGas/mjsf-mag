<script setup>
import {
  Comment,
  Fragment,
  computed,
  h,
  inject,
  onBeforeUnmount,
  onMounted,
  reactive,
  toRef,
  useSlots,
} from 'vue'
import { tabsKey } from './tabsKey.js'

const props = defineProps({
  slug: { type: String, required: true },
  title: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  panel: { type: Object, default: null },
  panelProps: { type: Object, default: () => ({}) },
})

const tabs = inject(tabsKey, null)

if (!tabs) {
  throw new Error(
    `[Tab] Вкладку "${props.slug}" розміщено поза компонентом Tabs: ` +
      'контекст tabsKey не знайдено. Розмістіть Tab усередині Tabs.',
  )
}

const entry = reactive({
  slug: toRef(props, 'slug'),
  title: toRef(props, 'title'),
  disabled: toRef(props, 'disabled'),
})

const isActive = computed(() => tabs.activeSlug.value === props.slug)
const idPrefix = tabs.idPrefix
const slots = useSlots()

// <slot> рендерить Fragment, а KeepAlive кешує лише один компонентний vnode,
// тому вміст слота передаємо в KeepAlive як vnode через <component :is>.
function slotPanel() {
  const nodes = slots.default({ isActive: isActive.value }).filter((node) => node.type !== Comment)
  return nodes.length === 1 ? nodes[0] : h(Fragment, nodes)
}

onMounted(() => {
  tabs.registerTab(entry)
})

onBeforeUnmount(() => {
  tabs.unregisterTab(entry.slug)
})
</script>

<template>
  <section
    :id="`${idPrefix}-panel-${slug}`"
    v-show="isActive"
    class="tabs__panel"
    role="tabpanel"
    :aria-labelledby="`${idPrefix}-tab-${slug}`"
    tabindex="0"
  >
    <KeepAlive>
      <component :is="slotPanel()" v-if="isActive && $slots.default" />
      <component :is="panel" v-else-if="isActive" v-bind="panelProps" />
    </KeepAlive>
  </section>
</template>

<style scoped lang="scss">
.tabs__panel {
  @apply p-4;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink;
}
</style>
