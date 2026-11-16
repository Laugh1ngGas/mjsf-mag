import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { HttpError, isAbortError, isUnauthorized, requestJson } from '../api/http.js'
import {
  clearStoredToken,
  loginRequest,
  notifySessionEnd,
  pickProfile,
  profileRequest,
  readStoredToken,
  writeStoredToken,
} from '../auth/session.js'

/**
 * status:
 *   idle          — перевірка збереженого токена ще не починалася
 *   restoring     — триває GET /auth/me
 *   signing-in    — триває POST /auth/login
 *   guest         — сеансу немає
 *   authenticated — токен і профіль підтверджено сервером
 *   unavailable   — перевірку не завершено через мережу; токен лишився для повтору
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(readStoredToken())
  const user = ref(null)
  const status = ref('idle')
  const error = ref(null)

  const isAuthenticated = computed(() =>
    status.value === 'authenticated' && Boolean(accessToken.value) && Boolean(user.value),
  )
  const isBusy = computed(() => status.value === 'restoring' || status.value === 'signing-in')
  const displayName = computed(() =>
    user.value ? `${user.value.firstName} ${user.value.lastName}`.trim() || user.value.username : '',
  )

  // Службові значення не є state: номер сеансу, контролер і Promise поточної перевірки.
  let generation = 0
  let controller = null
  let restorePromise = null

  function startOperation() {
    controller?.abort()
    controller = new AbortController()
    return { id: generation, controller }
  }

  function isCurrent(operation) {
    return operation.id === generation && operation.controller === controller && !operation.controller.signal.aborted
  }

  function finishOperation(operation) {
    if (controller === operation.controller)
      controller = null
  }

  function runRestore() {
    const token = accessToken.value

    if (!token) {
      status.value = 'guest'
      return Promise.resolve()
    }

    const operation = startOperation()
    status.value = 'restoring'
    error.value = null

    const promise = profileRequest(token, operation.controller.signal)
      .then((profile) => {
        if (!isCurrent(operation))
          return

        user.value = pickProfile(profile)
        status.value = 'authenticated'
      })
      .catch((cause) => {
        if (!isCurrent(operation) || isAbortError(cause))
          return

        if (isUnauthorized(cause)) {
          // Неприйнятний токен вилучається; користувач стає гостем.
          resetSession('Збережений сеанс недійсний або завершився. Увійдіть знову.')
          return
        }

        user.value = null
        status.value = 'unavailable'
        error.value = cause.status === 0
          ? 'Не вдалося перевірити сеанс: немає з’єднання з сервером.'
          : `Не вдалося перевірити сеанс (HTTP ${cause.status}).`
      })
      .finally(() => {
        finishOperation(operation)
        if (restorePromise === promise)
          restorePromise = null
      })

    restorePromise = promise
    return promise
  }

  // Перша перевірка запускає GET /auth/me; одночасні виклики чекають той самий Promise.
  function restore() {
    if (restorePromise)
      return restorePromise

    if (status.value !== 'idle')
      return Promise.resolve()

    return runRestore()
  }

  // Повтор після мережевої помилки зі збереженим токеном.
  function retryRestore() {
    if (status.value !== 'unavailable')
      return restorePromise ?? Promise.resolve()

    return runRestore()
  }

  async function login({ username, password }) {
    // Повторне натискання під час входу не створює паралельного POST.
    if (status.value === 'signing-in')
      return false

    restorePromise = null
    const operation = startOperation()
    status.value = 'signing-in'
    error.value = null

    try {
      const data = await loginRequest({ username, password }, operation.controller.signal)

      if (!isCurrent(operation))
        return false

      generation += 1
      accessToken.value = data.accessToken
      writeStoredToken(data.accessToken)
      user.value = pickProfile(data)
      status.value = 'authenticated'
      return true
    } catch (cause) {
      if (!isCurrent(operation) || isAbortError(cause))
        return false

      // Невдалий вхід не створює токена; попередній збережений токен лишається для повтору перевірки.
      status.value = accessToken.value ? 'unavailable' : 'guest'
      error.value = cause.status === 400
        ? 'Неправильне ім’я користувача або пароль.'
        : cause.status === 0
          ? 'Не вдалося увійти: немає з’єднання з сервером.'
          : `Не вдалося увійти (HTTP ${cause.status}).`
      return false
    } finally {
      finishOperation(operation)
    }
  }

  function resetSession(message = null) {
    generation += 1
    controller?.abort()
    controller = null
    restorePromise = null
    accessToken.value = null
    user.value = null
    clearStoredToken()
    status.value = 'guest'
    error.value = message
  }

  // Звичайний вихід. Локальний вихід не відкликає токен на сервері.
  function logout() {
    const wasActive = status.value !== 'guest'
    resetSession()

    if (wasActive)
      notifySessionEnd('logout')
  }

  // 401 приватного API для поточного токена.
  function expire() {
    resetSession('Сеанс завершено: сервер не прийняв токен (401). Увійдіть знову.')
    notifySessionEnd('expired')
  }

  /**
   * Приватний запит із поточним токеном.
   * 401 очищує лише той сеанс, токен якого було надіслано.
   */
  async function request(path, options = {}) {
    const token = accessToken.value

    if (!isAuthenticated.value || !token)
      throw new HttpError(401, 'Сеанс не підтверджено.')

    try {
      return await requestJson(path, { ...options, token })
    } catch (cause) {
      if (isUnauthorized(cause) && accessToken.value === token)
        expire()

      throw cause
    }
  }

  function $reset() {
    resetSession()
    status.value = 'idle'
  }

  return {
    accessToken,
    user,
    status,
    error,
    isAuthenticated,
    isBusy,
    displayName,
    restore,
    retryRestore,
    login,
    logout,
    expire,
    request,
    $reset,
  }
})
