import '~/assets/styles/main.css'
import '~/assets/styles/primevue/flags.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import MyPreset from './theme'
import i18n from '~/config/i18n'
import ToastService from 'primevue/toastservice'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Tooltip from 'primevue/tooltip'

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
    preset: MyPreset,
    options: {
      darkModeSelector: false || 'none',
    }
  },
})
app.directive('tooltip', Tooltip)
setupInterceptors()

app.mount('#app')

document.getElementById('initial-loader')?.remove()