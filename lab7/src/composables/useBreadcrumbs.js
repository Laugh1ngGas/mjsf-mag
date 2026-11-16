import { computed, toValue } from 'vue'
import { useRoute } from 'vue-router'

const PRODUCT_ROUTES = new Set(['product-overview', 'product-reviews', 'manage-edit'])

export function useBreadcrumbs(productTitle) {
  const route = useRoute()

  return computed(() => {
    const query = typeof route.query.q === 'string' && route.query.q ? { q: route.query.q } : {}

    // route.matched містить кожен рівень окремо; об’єднане route.meta цього не зберігає.
    return route.matched
      .filter((record) => record.meta.breadcrumb)
      .map((record) => {
        const crumb = record.meta.breadcrumb
        const label = crumb.dynamic === 'product'
          ? toValue(productTitle) ?? `Товар №${route.params.id}`
          : crumb.label
        const to = { name: crumb.name, query }

        if (PRODUCT_ROUTES.has(crumb.name))
          to.params = { id: route.params.id }

        return { label, to }
      })
  })
}
