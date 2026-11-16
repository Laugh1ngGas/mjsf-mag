import { onSessionEnd } from '../auth/session.js'
import { useAuthStore } from '../stores/auth.js'
import { useProductsStore } from '../stores/products.js'

// Після входу дозволено повертатися лише до приватних маршрутів керування.
const REDIRECT_ROUTES = new Set(['manage-products', 'manage-edit'])
const DEFAULT_TARGET = { name: 'manage-products' }

/**
 * Перевіряє ціль повернення з query.redirect.
 * Зовнішні (https://…, //host), невідомі адреси та сама форма входу замінюються списком керування.
 */
export function resolveSafeRedirect(router, raw) {
  if (typeof raw !== 'string' || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\'))
    return DEFAULT_TARGET

  try {
    const target = router.resolve(raw)
    return REDIRECT_ROUTES.has(target.name) ? target.fullPath : DEFAULT_TARGET
  } catch {
    return DEFAULT_TARGET
  }
}

export function installAuthGuards(router, pinia) {
  router.beforeEach(async (to) => {
    // Store отримується з явним екземпляром Pinia: гард може працювати до монтування App.
    const auth = useAuthStore(pinia)
    const pending = auth.restore()

    // Приватна навігація та форма входу чекають завершення початкової перевірки сеансу.
    if (to.meta.requiresAuth || to.name === 'login')
      await pending

    if (to.meta.requiresAuth && !auth.isAuthenticated)
      return { name: 'login', query: { redirect: to.fullPath } }

    // Підтверджений користувач не бачить форму входу повторно.
    if (to.name === 'login' && auth.isAuthenticated)
      return resolveSafeRedirect(router, to.query.redirect)
  })

  // Завершення сеансу на вже відкритій сторінці: гарда переходів для цього недостатньо.
  onSessionEnd((reason) => {
    useProductsStore(pinia).reset()

    const current = router.currentRoute.value

    if (!current.meta.requiresAuth)
      return

    if (reason === 'expired')
      router.replace({ name: 'login', query: { redirect: current.fullPath } })
    else
      router.replace({ name: 'products' })
  })
}
