import type { LoginResponse, TenantsResponse } from "./index"

export function isLoginResponse(
	response: LoginResponse | TenantsResponse
): response is LoginResponse {
	return !Array.isArray(response.data)
}