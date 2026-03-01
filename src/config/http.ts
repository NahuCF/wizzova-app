import axios, { AxiosError } from 'axios'
import { useSessionStore } from '~/stores/session'

const Http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
})

const allowedPaths = [
  '/tenant/meta-access',
  '/tenant/store-default-waba',
  '/tenant/select-number',
  '/tenant/verify-number-code',
  '/meta/app-id',
  '/login',
]

export function setupInterceptors() {
  const sessionStore = useSessionStore()

  Http.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message: string }>) => {
      if (error.response?.status === 401 && error.response.data.message === 'Unauthenticated.') {
        sessionStore.showOverrideDialog = true
      }
      return Promise.reject(error)
    },
  )

  Http.interceptors.request.use((config) => {
    const session = useSessionStore()

    if (session.token) {
      config.headers.Authorization = `Bearer ${session.token}`
    }

    if (session.tenant) {
      config.headers['X-Tenant'] = session.tenant.id
    }

    if (session.user?.default_waba) {
      config.headers['X-Waba-id'] = session.user.default_waba.id
    }

    const urlPath = config.url || ''
    if (
      session.tenant &&
      !session.tenant?.is_profile_completed &&
      !allowedPaths.some((path) => urlPath.includes(path))
    ) {
      return Promise.reject(new AxiosError('Profile is not complete', 'PROFILE_INCOMPLETE', config))
    }

    return config
  })
}

export default Http
