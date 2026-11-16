<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'

const route = useRoute()
const breadcrumbs = useBreadcrumbs()
const requestedPath = computed(() => route.fullPath)
</script>

<template>
  <div class="info-page">
    <Breadcrumbs :items="breadcrumbs" />

    <section class="catalog__message info-page__message" aria-labelledby="not-found-title">
      <p class="catalog__message-index">404 / ROUTE</p>
      <h1 id="not-found-title" class="catalog__message-title">Сторінку не знайдено</h1>
      <p class="catalog__message-text">
        Адреса <code class="info-page__path">{{ requestedPath }}</code> не відповідає жодному
        розділу застосунку.
      </p>
      <RouterLink class="catalog__retry" :to="{ name: 'products' }">Перейти до каталогу</RouterLink>
    </section>
  </div>
</template>
