import { createPinia } from 'pinia'

// Єдиний екземпляр Pinia: його отримують main.js і глобальний гард маршрутизатора.
export const pinia = createPinia()
