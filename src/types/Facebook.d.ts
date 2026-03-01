export {}

declare global {
  namespace FB {
    interface AuthResponse {
      accessToken: string
      userID: string
      expiresIn: number
      signedRequest: string
      reauthorize_required_in?: number
      data_access_expiration_time?: number
    }

    interface LoginStatusResponse {
      status: 'connected' | 'not_authorized' | 'unknown'
      authResponse?: AuthResponse
    }

    interface LoginOptions {
      scope?: string
      return_scopes?: boolean
      auth_type?: string
    }
  }

  interface Window {
    fbAsyncInit: () => void
    FB: {
      init: (params: {
        appId: string
        autoLogAppEvents: boolean
        xfbml: boolean
        version: string
      }) => void
      login: (
        callback: (response: FB.LoginStatusResponse) => void,
        options?: FB.LoginOptions,
      ) => void
    }
  }
}
