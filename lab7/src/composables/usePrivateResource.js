import { ref, shallowRef, toValue, watch } from 'vue'
import { isAbortError } from '../api/http.js'
import { useAuthStore } from '../stores/auth.js'

/**
 * Реактивне читання приватного API через auth.request.
 * Стан data / isLoading / error належить composable, а не store.
 * path === null — запиту немає (наприклад, некоректний id).
 */
export function usePrivateResource(path) {
  const auth = useAuthStore()

  const data = shallowRef(null)
  const error = shallowRef(null)
  const isLoading = ref(false)
  const reloadCount = ref(0)

  function refetch() {
    reloadCount.value += 1
  }

  watch(
    [() => toValue(path), reloadCount],
    ([currentPath], _previous, onCleanup) => {
      // Нове джерело не показує дані чи помилку попереднього.
      data.value = null
      error.value = null

      if (!currentPath) {
        isLoading.value = false
        return
      }

      const controller = new AbortController()
      let isActive = true

      // Зміна адреси або демонтування скасовує старе завантаження.
      onCleanup(() => {
        isActive = false
        controller.abort()
      })

      isLoading.value = true

      auth.request(currentPath, { signal: controller.signal })
        .then((result) => {
          if (isActive)
            data.value = result
        })
        .catch((cause) => {
          if (isActive && !isAbortError(cause))
            error.value = cause
        })
        .finally(() => {
          if (isActive)
            isLoading.value = false
        })
    },
    { immediate: true },
  )

  return { data, error, isLoading, refetch }
}
