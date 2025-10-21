import '~/assets/styles/main.css'
import '~/assets/styles/primevue/flags.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { preset, passthrough } from './theme'
import i18n from '~/config/i18n'
import ToastService from 'primevue/toastservice'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Tooltip from 'primevue/tooltip'
import VueApexCharts from "vue3-apexcharts"

import App from './App.vue'
import router from '../router'
import { setupInterceptors } from '~/config/http'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)
app.use(ToastService)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: preset,
    options: {
      darkModeSelector: false || 'none',
    }
  },
  pt: passthrough
})
app.use(VueApexCharts)
app.directive('tooltip', Tooltip)
setupInterceptors()

app.mount('#app')

document.getElementById('initial-loader')?.remove()