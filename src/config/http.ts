import axios from 'axios'
import { useSessionStore } from '~/stores/session'

const Http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  },
})

// Define types for our error structure
interface ValidationErrors {
  [field: string]: string[]
}

interface CustomError {
  isValidationError: boolean
  validationErrors: ValidationErrors
}

Http.interceptors.response.use(
  (response) => {
    let token = response?.data?.data?.token
    if (token) {
      sessionStorage.setItem('apiToken', token)
    }
    return response
  },
  function (error) {
    if (error.response.status === 422) {
      const validationErrors: ValidationErrors = (error.response.data as any).errors || {}
      Object.entries(validationErrors).forEach(([field, messages]) => {})
      return Promise.reject<CustomError>({
        isValidationError: true,
        validationErrors,
      })
    }
    return Promise.reject(error)
  },
)

Http.interceptors.request.use((config) => {
  let session = useSessionStore()
  let token = sessionStorage.apiToken
  let tenant = session.getTenant

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (tenant && tenant.verifiedEmail && tenant.filledBasicInformation) {
    console.log('here')
    config.headers['X-Tenant'] = tenant.id
  }

  config.headers.Authorization = `Bearer 2|Ei9Mrd8SPCsNEsw6PeTZcYF8FKiYRx6SEcuFwLet8c461264`
  return config
})

export default Http
