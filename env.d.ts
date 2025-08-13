/// <reference types="vite/client" />

declare module '*.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare namespace FB {
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

    function init(params: {
        appId: string
        autoLogAppEvents: boolean
        xfbml: boolean
        version: string
    }): void

    function login(
        callback: (response: LoginStatusResponse) => void,
        options?: LoginOptions,
    ): void
}

declare global {
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
