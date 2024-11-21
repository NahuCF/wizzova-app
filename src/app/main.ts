import '~/assets/styles/main.css'
import '~/assets/styles/primevue/flags.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import MyPreset from './theme'
import i18n from '~/config/i18n'

import App from './App.vue'
import router from '../router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
  },
})

app.mount('#app')
