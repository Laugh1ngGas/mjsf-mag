export const API_BASE = 'https://dummyjson.com'

// Помилка запиту зберігає HTTP-статус; 0 означає, що відповіді від сервера немає.
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export const isAbortError = (error) => error?.name === 'AbortError'
export const isUnauthorized = (error) => error?.status === 401
export const isNetworkError = (error) => error?.status === 0

async function readErrorMessage(response) {
  try {
    const body = await response.json()
    return typeof body?.message === 'string' ? body.message : ''
  } catch {
    return ''
  }
}

/**
 * JSON-запит до навчального API.
 * token передається лише в заголовку Authorization, ніколи в URL.
 * credentials: 'omit' — модель із явним Bearer без cookie.
 */
export async function requestJson(path, { method = 'GET', body, token, signal } = {}) {
  const headers = { Accept: 'application/json' }

  if (token)
    headers.Authorization = `Bearer ${token}`

  const init = { method, headers, signal, credentials: 'omit' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response

  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch (cause) {
    // Скасування передається далі без змін, щоб викликач міг його ігнорувати.
    if (isAbortError(cause))
      throw cause

    throw new HttpError(0, 'Сервер недоступний: перевірте з’єднання з мережею.')
  }

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new HttpError(response.status, message || `HTTP ${response.status}`)
  }

  return response.json()
}
