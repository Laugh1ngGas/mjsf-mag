import { readonly, ref, toValue, watch } from 'vue'

export function useDebouncedValue(source, delay = 400) {
  const debounced = ref(toValue(source))

  watch(
    () => toValue(source),
    (value, _previous, onCleanup) => {
      const timer = setTimeout(() => {
        debounced.value = value
      }, toValue(delay))

      // Нове значення джерела або розмонтування видаляє попередній таймер.
      onCleanup(() => clearTimeout(timer))
    },
  )

  return readonly(debounced)
}
