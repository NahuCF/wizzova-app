import { createI18n } from 'vue-i18n'
import en from '~/lang/en'
import es from '~/lang/es'

const i18n = createI18n({
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    es,
  },
})

export default i18n
