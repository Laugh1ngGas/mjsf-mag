const API_URL = 'https://dummyjson.com/products'

export const PAGE_SIZE = 12
export const API_DELAY = 1500
export const PRODUCT_DELAY = 800

export function createProductsUrl(query, skip = 0) {
  const searchTerm = query.trim()
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String(skip),
    delay: String(API_DELAY),
  })

  if (searchTerm) {
    params.set('q', searchTerm)
    return `${API_URL}/search?${params}`
  }

  return `${API_URL}?${params}`
}

export function createProductUrl(id) {
  const params = new URLSearchParams({ delay: String(PRODUCT_DELAY) })
  return `${API_URL}/${encodeURIComponent(id)}?${params}`
}

// Дозволений id — рядок додатного цілого числа без ведучих нулів.
export function isValidProductId(id) {
  return typeof id === 'string' && /^[1-9]\d*$/.test(id)
}
