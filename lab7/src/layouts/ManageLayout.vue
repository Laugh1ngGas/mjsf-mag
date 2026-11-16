<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'
import { useProductsStore } from '../stores/products.js'

const auth = useAuthStore()
const { isAuthenticated, displayName } = storeToRefs(auth)
const { changedCount } = storeToRefs(useProductsStore())
</script>

<template>
  <div class="manage">
    <!-- Приватний вміст існує лише для підтвердженого сеансу. -->
    <template v-if="isAuthenticated">
      <header class="manage__header">
        <p class="manage__eyebrow">Приватний розділ · {{ displayName }}</p>
        <p class="manage__notice" role="note">
          <span class="manage__notice-mark" aria-hidden="true">!</span>
          <span>
            DummyJSON лише імітує PATCH. Підтверджені зміни
            <strong>({{ changedCount }})</strong> діють у цьому сеансі до reload або виходу й не
            записуються у Web Storage. Пошук каталогу працює з початковими даними.
          </span>
        </p>
      </header>

      <RouterView />
    </template>

    <div v-else class="catalog__message manage__locked" aria-live="polite">
      <p class="catalog__message-index">401 / SESSION</p>
      <h1 class="catalog__message-title">Сеанс не підтверджено</h1>
      <p class="catalog__message-text">Приватний вміст приховано до входу.</p>
    </div>
  </div>
</template>
