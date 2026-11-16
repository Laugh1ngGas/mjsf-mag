<script setup>
import { nextTick, ref, useTemplateRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import Breadcrumbs from '../components/Breadcrumbs.vue'
import { useBreadcrumbs } from '../composables/useBreadcrumbs.js'
import { useAuthStore } from '../stores/auth.js'
import { resolveSafeRedirect } from '../router/guards.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { status, error, isBusy } = storeToRefs(auth)
const { login, retryRestore } = auth
const breadcrumbs = useBreadcrumbs()

// Облікові дані — локальний стан форми; пароль не потрапляє до store.
const username = ref('')
const password = ref('')
const passwordInput = useTemplateRef('password-input')

const hasRedirect = typeof route.query.redirect === 'string'

function openTarget() {
  return router.replace(resolveSafeRedirect(router, route.query.redirect))
}

async function submit() {
  if (isBusy.value)
    return

  const credentials = { username: username.value.trim(), password: password.value }
  // Пароль очищується одразу після передавання до дії входу.
  password.value = ''

  if (await login(credentials)) {
    await openTarget()
    return
  }

  await nextTick()
  passwordInput.value?.focus()
}

async function retry() {
  await retryRestore()

  if (auth.isAuthenticated)
    await openTarget()
}
</script>

<template>
  <div class="login">
    <Breadcrumbs :items="breadcrumbs" />

    <section class="login__panel" aria-labelledby="login-title">
      <div class="login__intro">
        <p class="login__eyebrow">Auth / DummyJSON</p>
        <h1 id="login-title" class="login__title">Вхід до керування</h1>
        <p class="login__text">
          Приватний список і редактор товарів відкриваються лише після підтвердження сеансу
          сервером.
        </p>
        <p v-if="hasRedirect" class="login__target">
          Після входу відкриється запитана сторінка керування.
        </p>
        <p class="login__hint">Навчальний обліковий запис: <code>emilys</code></p>
      </div>

      <form class="login__form" novalidate @submit.prevent="submit">
        <div v-if="status === 'unavailable'" class="login__unavailable" role="status">
          <p class="login__unavailable-text">
            Збережений сеанс не перевірено: сервер недоступний. Приватний вміст закрито, токен
            лишився для повтору.
          </p>
          <button class="login__button login__button--ghost" type="button" :disabled="isBusy" @click="retry">
            Повторити перевірку
          </button>
        </div>

        <div class="field">
          <label class="field__label" for="login-username">Ім’я користувача</label>
          <input
            id="login-username"
            v-model="username"
            class="field__input"
            name="username"
            type="text"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
            :disabled="isBusy"
            :aria-invalid="Boolean(error) || undefined"
            :aria-describedby="error ? 'login-error' : undefined"
          />
        </div>

        <div class="field">
          <label class="field__label" for="login-password">Пароль</label>
          <input
            id="login-password"
            ref="password-input"
            v-model="password"
            class="field__input"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="isBusy"
            :aria-invalid="Boolean(error) || undefined"
            :aria-describedby="error ? 'login-error' : undefined"
          />
        </div>

        <p v-if="error" id="login-error" class="login__error" role="alert">{{ error }}</p>

        <button class="login__button" type="submit" :disabled="isBusy" :aria-busy="isBusy">
          <span v-if="status === 'signing-in'" class="login__spinner" aria-hidden="true"></span>
          {{ status === 'signing-in' ? 'Входимо…' : status === 'restoring' ? 'Перевіряємо сеанс…' : 'Увійти' }}
        </button>
      </form>
    </section>
  </div>
</template>
