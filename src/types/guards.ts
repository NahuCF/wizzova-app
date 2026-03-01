import type {
  LoginResponse,
  TemplateButton,
  TemplateCallBtn,
  TemplateUrlBtn,
  TenantsResponse,
} from './index'

export const isLoginResponse = (
  response: LoginResponse | TenantsResponse,
): response is LoginResponse => {
  return !Array.isArray(response.data)
}

export const isUrlButton = (button: TemplateButton): button is TemplateUrlBtn => {
  return button.type === 'STATIC_URL' || button.type === 'DYNAMIC_URL'
}

export const isCallButton = (button: TemplateButton): button is TemplateCallBtn => {
  return button.type === 'PHONE_NUMBER'
}
