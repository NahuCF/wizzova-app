import { ref } from "vue"

export const useFacebookLogin = () => {
	const isSdkLoaded = ref(false)
	const isInitialized = ref(false)

	const loadSDK = () => {
		return new Promise<void>((resolve, reject) => {
			if (document.getElementById('facebook-jssdk')) {
				isSdkLoaded.value = true
				resolve()
				return
			}

			const js = document.createElement('script')
			js.id = 'facebook-jssdk'
			js.src = 'https://connect.facebook.net/en_US/sdk.js'
			js.onload = () => {
				isSdkLoaded.value = true
				resolve()
			}
			js.onerror = () => reject(new Error('Failed to load Facebook SDK'))
			document.body.appendChild(js)
		})
	}

	const initializeSDK = (appId: string) => {
		return new Promise<void>((resolve) => {
			if (!isSdkLoaded.value) throw new Error('SDK not loaded yet')

			window.fbAsyncInit = () => {
				window.FB.init({
					appId,
					autoLogAppEvents: true,
					xfbml: true,
					version: 'v22.0',
				})
				isInitialized.value = true
				resolve()
			}
		})
	}

	const initialize = async (appId: string) => {
		await loadSDK()
		await initializeSDK(appId)
	}

	const launchLogin = (scope: string) => {
		if (import.meta.env.VITE_APP_ENV !== 'production') {
			return {
				accessToken: 'accessToken',
				userID: 'userID',
				expiresIn: 99999,
				signedRequest: ''
			}
		}

		return new Promise<FB.AuthResponse>((resolve, reject) => {
			if (!isInitialized.value) {
				reject(new Error('Facebook SDK not initialized'))
				return
			}
			window.FB.login(
				(response) => {
					if (response.authResponse) {
						resolve(response.authResponse)
					} else {
						reject(new Error('Login failed'))
					}
				},
				{ scope }
			)
		})
	}

	return {
		isSdkLoaded,
		isInitialized,
		initialize,
		launchLogin
	}
}