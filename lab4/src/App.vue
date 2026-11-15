<script setup>
import { ref } from 'vue'
import Tabs from './components/tabs/Tabs.vue'
import Tab from './components/tabs/Tab.vue'
import OverviewPanel from './components/demo-panels/OverviewPanel.vue'
import RequirementsPanel from './components/demo-panels/RequirementsPanel.vue'
import EnvironmentPanel from './components/demo-panels/EnvironmentPanel.vue'

const underlineTab = ref('overview')
const pillsTab = ref('goals')
const boxedTab = ref('environment')

const pillTabs = [
  {
    slug: 'goals',
    title: 'Мета',
    panel: OverviewPanel,
    panelProps: { heading: 'Мета роботи' },
  },
  {
    slug: 'checklist',
    title: 'Чекліст',
    panel: RequirementsPanel,
    panelProps: {
      heading: 'Чекліст перевірки',
      items: [
        'Три варіанти оформлення на одній сторінці',
        'Незалежний активний стан кожного набору',
        'Пропуск вимкненої вкладки клавіатурою',
      ],
    },
  },
  {
    slug: 'notes',
    title: 'Нотатки',
    panel: OverviewPanel,
    panelProps: { heading: 'Нотатки до тестування' },
  },
]
</script>

<template>
  <div class="page">
    <header class="page__header">
      <div class="page__intro">
        <h1 class="page__title">Вкладки: слоти та provide/inject</h1>
        <p class="page__lead">
          Лабораторна робота 4. Три незалежні набори вкладок з автоматичною активацією,
          контекстом tabsKey і кешуванням панелей у KeepAlive.
        </p>
      </div>

      <dl class="page__meta">
        <div class="page__meta-item">
          <dt class="page__meta-term">Студент</dt>
          <dd class="page__meta-value">Бойчук Б.Е. · група 7.F2.25-2</dd>
        </div>
        <div class="page__meta-item">
          <dt class="page__meta-term">Середовище</dt>
          <dd class="page__meta-value">Windows 11 · Chrome · Node.js 25.1.0 · Vue 3.5.45</dd>
        </div>
      </dl>
    </header>

    <main class="page__content">
      <section class="page__section">
        <h2 class="page__section-title">underline — панелі передано слотами</h2>
        <Tabs v-model="underlineTab" variant="underline" aria-label="Основні вкладки">
          <Tab v-slot="{ isActive }" slug="overview" title="Огляд">
            <OverviewPanel :is-active="isActive" />
          </Tab>
          <Tab slug="requirements" title="Вимоги">
            <RequirementsPanel />
          </Tab>
          <Tab v-slot="{ isActive }" slug="environment" title="Середовище">
            <EnvironmentPanel :is-active="isActive" />
          </Tab>
        </Tabs>
        <p class="page__state">v-model: {{ underlineTab }}</p>
      </section>

      <section class="page__section">
        <h2 class="page__section-title">pills — панелі з масиву через component :is</h2>
        <Tabs v-model="pillsTab" variant="pills" aria-label="Вкладки з масиву">
          <Tab
            v-for="tab in pillTabs"
            :key="tab.slug"
            :slug="tab.slug"
            :title="tab.title"
            :panel="tab.panel"
            :panel-props="tab.panelProps"
          />
        </Tabs>
        <p class="page__state">v-model: {{ pillsTab }}</p>
      </section>

      <section class="page__section">
        <h2 class="page__section-title">boxed — вимкнена вкладка та ModalDialog</h2>
        <Tabs v-model="boxedTab" variant="boxed" aria-label="Вкладки з діалогом">
          <Tab v-slot="{ isActive }" slug="environment" title="Середовище">
            <EnvironmentPanel heading="Середовище (другий екземпляр)" :is-active="isActive" />
          </Tab>
          <Tab slug="archive" title="Архів" disabled>
            <p>Вкладка недоступна.</p>
          </Tab>
          <Tab v-slot="{ isActive }" slug="notes" title="Нотатки">
            <OverviewPanel heading="Нотатки до діалогу" :is-active="isActive" />
          </Tab>
        </Tabs>
        <p class="page__state">v-model: {{ boxedTab }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.page {
  @apply min-h-screen bg-surface px-4 py-6 sm:py-8;

  &__header {
    @apply mx-auto flex max-w-3xl flex-col gap-4 lg:max-w-6xl lg:flex-row lg:items-end lg:justify-between;
  }

  &__title {
    @apply font-display text-xl font-bold text-ink sm:text-2xl;
  }

  &__lead {
    @apply mt-2 text-sm leading-relaxed text-muted;
  }

  &__meta {
    @apply m-0 grid gap-2 sm:grid-cols-2;
  }

  &__meta-item {
    @apply rounded-lg border border-edge bg-paper px-3 py-2;
  }

  &__meta-term {
    @apply text-xs font-semibold uppercase tracking-wide text-muted;
  }

  &__meta-value {
    @apply m-0 break-words text-sm font-semibold text-ink;
  }

  &__content {
    @apply mx-auto mt-6 flex max-w-3xl flex-col gap-8 lg:grid lg:max-w-6xl lg:grid-cols-3 lg:items-start lg:gap-6;
  }

  &__section {
    @apply flex min-w-0 flex-col gap-3;
  }

  &__section-title {
    @apply font-display text-sm font-bold text-ink;
  }

  &__state {
    @apply font-mono text-xs text-muted;
  }
}
</style>
