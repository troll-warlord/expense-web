import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'

import '@/assets/main.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('VueApexCharts', VueApexCharts)

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches unhandled errors thrown inside Vue component lifecycle hooks and
// event handlers. The ErrorBoundary component handles render errors.
app.config.errorHandler = (err, _vm, info) => {
  console.error('[Vue Error]', info, err)
}

// Catch unhandled promise rejections outside Vue tree (e.g. top-level awaits)
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason)
})

app.mount('#app')
