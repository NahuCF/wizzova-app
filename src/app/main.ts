import '~/assets/styles/main.css'
import '~/assets/styles/primevue/flags.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import MyPreset from './theme'
import i18n from '~/config/i18n'
import ToastService from 'primevue/toastservice'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useRoute } from 'vue-router'
import { watchEffect } from 'vue'

import App from './App.vue'
import router from '../router'

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
  },
})

app.mount('#app')
