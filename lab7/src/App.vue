<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from './stores/auth.js'
import { useProductsStore } from './stores/products.js'

// Обидва сховища створюються в setup App, тому одразу видимі у Vue DevTools.
const auth = useAuthStore()
useProductsStore()

// storeToRefs зберігає реактивність state і getters; дії деструктуруються напряму.
const { user, status, isAuthenticated, displayName } = storeToRefs(auth)
const { logout, retryRestore } = auth
</script>

<template>
  <div class="storefront">
    <header class="storefront__masthead">
      <RouterLink class="storefront__brand" :to="{ name: 'products' }" aria-label="Forma, до каталогу">
        FORMA<span class="storefront__brand-mark">®</span>
      </RouterLink>
      <p class="storefront__edition">Лабораторна / 07</p>
      <p class="storefront__note">Бойчук Б.Е. · 7.F2.25-2 · Windows 11 · Chrome · Node.js 25.1.0</p>
    </header>

    <div class="storefront__bar">
      <nav class="storefront__nav" aria-label="Основна навігація">
        <RouterLink class="storefront__nav-link" :to="{ name: 'products' }">Каталог</RouterLink>
        <RouterLink class="storefront__nav-link" :to="{ name: 'manage-products' }">Керування</RouterLink>
        <RouterLink class="storefront__nav-link" :to="{ name: 'about' }">Про застосунок</RouterLink>
      </nav>

      <div class="session" aria-live="polite">
        <template v-if="isAuthenticated">
          <img v-if="user.image" class="session__avatar" :src="user.image" alt="" width="32" height="32" />
          <span class="session__name">{{ displayName }}</span>
          <button class="session__button" type="button" @click="logout">Вийти</button>
        </template>
        <template v-else-if="status === 'restoring' || status === 'idle'">
          <span class="session__status">Перевіряємо сеанс…</span>
        </template>
        <template v-else-if="status === 'unavailable'">
          <span class="session__status session__status--warning">Сеанс не перевірено</span>
          <button class="session__button" type="button" @click="retryRestore">Повторити</button>
        </template>
        <template v-else-if="status === 'signing-in'">
          <span class="session__status">Входимо…</span>
        </template>
        <RouterLink v-else class="session__button" :to="{ name: 'login' }">Увійти</RouterLink>
      </div>
    </div>

    <main class="storefront__main">
      <RouterView />
    </main>

    <footer class="storefront__footer">
      <p>Студент: Бойчук Богдан Едуардович · група 7.F2.25-2</p>
      <p>Середовище: Windows 11 · Chrome · Node.js 25.1.0 · Vue 3.5 · Vue Router 4.6 · Pinia 3.0</p>
      <a href="https://dummyjson.com/docs/auth" target="_blank" rel="noreferrer">
        Дані: DummyJSON
      </a>
    </footer>
  </div>
</template>
