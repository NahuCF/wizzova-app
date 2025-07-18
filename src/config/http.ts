import axios from 'axios'
import { useSessionStore } from '~/stores/session'

const Http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json',
  },
})

Http.interceptors.response.use(
  (response) => {
    return response
  },
  function (error) {
    return Promise.reject(error)
  },
)

Http.interceptors.request.use((config) => {
  const session = useSessionStore()
  const tenant = session.getTenant

  if (tenant.token) {
    config.headers.Authorization = `Bearer ${tenant.token}`
  }

  if (tenant) {
    config.headers['X-Tenant'] = tenant.id
  }

  return config
})

export default Http
