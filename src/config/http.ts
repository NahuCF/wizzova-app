import axios from 'axios'
import { useSessionStore } from '~/stores/session'

const Http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
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
  const token = sessionStorage.apiToken
  const tenant = session.getTenant

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (tenant) {
    config.headers['X-Tenant'] = tenant.id
  }

  return config
})

export default Http
