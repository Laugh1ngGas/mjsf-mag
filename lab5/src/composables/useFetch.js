import { ref, shallowRef, toValue, watchEffect } from 'vue'

export function useFetch(url) {
  const data = shallowRef(null)
  const error = shallowRef(null)
  const isLoading = ref(false)
  const reloadCount = ref(0)

  let activeController = null

  function abort() {
    if (!activeController)
      return

    activeController.abort()
    activeController = null
    isLoading.value = false
  }

  function refetch() {
    reloadCount.value += 1
  }

  watchEffect(async (onCleanup) => {
    // Залежності читаються до першого await: URL і лічильник повторів.
    const currentUrl = toValue(url)
    reloadCount.value

    const controller = new AbortController()
    activeController = controller
    onCleanup(() => controller.abort())

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(currentUrl, { signal: controller.signal })

      if (!response.ok)
        throw new Error(`HTTP ${response.status}`)

      const page = await response.json()

      if (!controller.signal.aborted)
        data.value = page
    } catch (cause) {
      // Скасування — очікуване завершення, а не помилка інтерфейсу.
      if (!controller.signal.aborted)
        error.value = cause
    } finally {
      // Старий запуск не вимикає індикатор нового запиту.
      if (activeController === controller) {
        activeController = null
        isLoading.value = false
      }
    }
  })

  return { data, error, isLoading, abort, refetch }
}
