import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './stores/index.js'
import { router } from './router/index.js'
import './styles/main.css'

// Pinia підключається перед маршрутизатором: початкова навігація вже має доступ до auth.
createApp(App).use(pinia).use(router).mount('#app')
