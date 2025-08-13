import axios, { AxiosError } from 'axios'
import { useSessionStore } from '~/stores/session'

const Http = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		Accept: 'application/json',
	},
})

export function setupInterceptors() {
	const sessionStore = useSessionStore()

	Http.interceptors.response.use(
		(response) => response,
		(error: AxiosError<{ message: string }>) => {
			if (error.response?.status === 401 && error.response.data.message === 'Unauthenticated.') {
				sessionStore.showOverrideDialog = true
			}
			return Promise.reject(error)
		}
	)

	Http.interceptors.request.use((config) => {
		const session = useSessionStore()

		if (session.token) {
			config.headers.Authorization = `Bearer ${session.token}`
		}

		if (session.tenant) {
			config.headers['X-Tenant'] = session.tenant.id
		}

		const allowedPaths = [
			'/tenant/meta-access',
			'/tenant/complete-profile',
			'/meta/app-id'
		]

		const urlPath = config.url || ''

		if (
			session.tenant &&
			!session.tenant?.is_profile_completed &&
			!allowedPaths.some((path) => urlPath.includes(path))
		) {
			return Promise.reject(
				new AxiosError(
					'Profile is not complete',
					'PROFILE_INCOMPLETE',
					config
				)
			)
		}

		return config
	})
}

export default Http