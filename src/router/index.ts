import { createRouter, createWebHistory } from 'vue-router'
import publicRoutes from './routes/public'
import i18n from '~/config/i18n'
import privateRoutes from './routes/private'
import { useSessionStore } from '~/stores/session'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, ...privateRoutes],
})

const updateTitle = (route) => {
  const titleKey = route.meta.titleKey
  const appName = import.meta.env.VITE_APP_NAME

  const title = titleKey ? i18n.global.t(titleKey) : 'No title'

  document.title = `${appName} | ${title}`
}

router.beforeEach((to, from, next) => {
  updateTitle(to)

  const sessionStore = useSessionStore()

  if (to.meta.public == true && sessionStore.isAuthenticated) {
    next({ name: 'conversations' })
  }

  if (to.meta.public == false && !sessionStore.isAuthenticated) {
    next({ name: 'login' })
  }

  next()
})

export default router
