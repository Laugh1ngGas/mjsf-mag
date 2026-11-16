import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.js'
import { EDITABLE_FIELDS } from '../api/productDraft.js'

// Підтверджену зміну потрібно відкинути: операція чи сеанс уже не актуальні.
export class StaleOperationError extends Error {
  constructor() {
    super('Операцію збереження скасовано: сеанс або операція вже не актуальні.')
    this.name = 'StaleOperationError'
  }
}

/**
 * Лише підтверджені API зміни товарів поточного сеансу, згруповані за id.
 * Словник не записується у Web Storage: reload або вихід повертають дані DummyJSON.
 */
export const useProductsStore = defineStore('products', () => {
  const auth = useAuthStore()

  const confirmedChanges = ref({})

  const changedCount = computed(() => Object.keys(confirmedChanges.value).length)

  // Відображуваний товар = прочитані дані + підтверджені зміни цього сеансу.
  const withChanges = computed(() => (product) => {
    if (!product)
      return product

    const changes = confirmedChanges.value[product.id]
    return changes ? { ...product, ...changes } : product
  })

  const isChanged = computed(() => (id) => Boolean(confirmedChanges.value[id]))

  let saveController = null
  let saveOperation = 0

  async function save(id, values) {
    if (saveController)
      throw new Error('Збереження вже триває.')

    const operation = ++saveOperation
    const token = auth.accessToken
    const controller = new AbortController()
    saveController = controller

    // До API надходять лише чотири редаговані поля; id береться з маршруту.
    const body = Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, values[field]]))

    try {
      const updated = await auth.request(`/auth/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body,
        signal: controller.signal,
      })

      // Пізня відповідь після виходу, нового входу чи reset не змінює словник.
      if (operation !== saveOperation || controller.signal.aborted || !auth.isAuthenticated || auth.accessToken !== token)
        throw new StaleOperationError()

      const confirmed = Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, updated[field]]))
      confirmedChanges.value = { ...confirmedChanges.value, [id]: confirmed }
      return confirmed
    } finally {
      if (saveController === controller)
        saveController = null
    }
  }

  // Очищення після завершення сеансу: словник і незавершене збереження.
  function reset() {
    saveOperation += 1
    saveController?.abort()
    saveController = null
    confirmedChanges.value = {}
  }

  return { confirmedChanges, changedCount, withChanges, isChanged, save, reset, $reset: reset }
})
