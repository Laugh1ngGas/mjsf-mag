import { onBeforeUnmount, onMounted, readonly, ref, toValue, watch } from 'vue'

export function useIntersectionObserver(target, callback, options = {}) {
  const isIntersecting = ref(false)

  let observer = null
  let stopWatch = null

  onMounted(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window))
      return

    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isIntersecting.value = entry.isIntersecting

        if (entry.isIntersecting)
          callback(entry)
      }
    }, options)

    stopWatch = watch(
      () => toValue(target),
      (element, previous) => {
        if (previous)
          observer.unobserve(previous)

        if (element)
          observer.observe(element)
      },
      { immediate: true, flush: 'post' },
    )
  })

  function stop() {
    stopWatch?.()
    stopWatch = null
    observer?.disconnect()
    observer = null
  }

  // Повторна підписка змушує браузер надіслати актуальний стан перетину цілі.
  function refresh() {
    const element = toValue(target)

    if (!observer || !element)
      return

    observer.unobserve(element)
    observer.observe(element)
  }

  onBeforeUnmount(stop)

  return { isIntersecting: readonly(isIntersecting), refresh, stop }
}
