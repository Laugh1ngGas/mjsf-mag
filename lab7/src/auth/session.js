import { requestJson } from '../api/http.js'

// У sessionStorage зберігається лише access token: без пароля, профілю й refresh token.
const TOKEN_KEY = 'forma.lab7.accessToken'
const SESSION_MINUTES = 30

export function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function writeStoredToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Без сховища сеанс працює до reload.
  }
}

export function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Немає доступу до сховища — нічого очищувати.
  }
}

// Профіль зі спільного стану: лише поля, потрібні інтерфейсу.
export function pickProfile(data) {
  return {
    id: data.id,
    username: data.username,
    firstName: data.firstName,
    lastName: data.lastName,
    image: data.image,
  }
}

export function loginRequest({ username, password }, signal) {
  return requestJson('/auth/login', {
    method: 'POST',
    body: { username, password, expiresInMins: SESSION_MINUTES },
    signal,
  })
}

export function profileRequest(token, signal) {
  return requestJson('/auth/me', { token, signal })
}

// Повідомлення про завершення сеансу для гарда, який прибирає приватну сторінку.
const sessionEndListeners = new Set()

export function onSessionEnd(listener) {
  sessionEndListeners.add(listener)
  return () => sessionEndListeners.delete(listener)
}

export function notifySessionEnd(reason) {
  for (const listener of sessionEndListeners)
    listener(reason)
}
