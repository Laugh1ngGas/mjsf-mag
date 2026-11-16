<script setup>
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'

const breadcrumbs = useBreadcrumbs()
</script>

<template>
  <div class="info-page">
    <Breadcrumbs :items="breadcrumbs" />

    <section class="info-page__body" aria-labelledby="about-title">
      <p class="storefront__eyebrow">Лабораторна робота 6</p>
      <h1 id="about-title" class="info-page__title">Про застосунок</h1>
      <p class="info-page__text">
        Каталог товарів DummyJSON на Vue 3 і Vue Router 4. Адреса визначає представлення:
        каталог із пошуком у параметрі <code>q</code>, сторінку товару <code>/products/:id</code>
        з оглядом і відгуками в спільній оболонці, а хлібні крихти будуються з метаданих маршрутів.
      </p>
      <ul class="info-page__list">
        <li>Пошук зберігається в адресі й відновлюється після оновлення та переходів історією.</li>
        <li>Огляд і відгуки одного товару перемикаються без повторного запиту до API.</li>
        <li>Невідома адреса показує окрему сторінку, відсутній товар — власний стан.</li>
      </ul>
      <RouterLink class="catalog__retry" :to="{ name: 'products' }">Перейти до каталогу</RouterLink>
    </section>
  </div>
</template>
