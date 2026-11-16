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

    // Новий запуск не показує дані чи помилку попереднього ресурсу.
    data.value = null
    error.value = null

    // null означає відсутність URL: запит не виконується.
    if (!currentUrl) {
      activeController = null
      isLoading.value = false
      return
    }

    const controller = new AbortController()
    activeController = controller
    onCleanup(() => controller.abort())

    const isCurrent = () => activeController === controller && !controller.signal.aborted

    isLoading.value = true

    try {
      const response = await fetch(currentUrl, { signal: controller.signal })

      if (!response.ok) {
        const httpError = new Error(`HTTP ${response.status}`)
        httpError.status = response.status
        throw httpError
      }

      const page = await response.json()

      if (isCurrent())
        data.value = page
    } catch (cause) {
      // Скасування — очікуване завершення, а не помилка інтерфейсу.
      if (isCurrent())
        error.value = cause
    } finally {
      // Старий запуск не змінює стан нового.
      if (activeController === controller) {
        activeController = null
        isLoading.value = false
      }
    }
  })

  return { data, error, isLoading, abort, refetch }
}
