import Http from '~/config/http'
import type { LoginForm, RegisterForm } from '~/types/Auth'

export default {
  async login(data: LoginForm) {
    return Http.post('/login', data)
  },
  async register(data: RegisterForm) {
    return Http.post('/register', data)
  },
  async sendVerifyAccount(data: { email: string }) {
    return Http.post('/send-verify-account', data)
  },
  async verifyAccount(token: string) {
    return Http.post('/verify-account', {
      token,
    })
  },
  async resendOtp(email: string) {
    return Http.post('/resend-otp', { email })
  },
  async verifyOtp(payload: any) {
    return Http.post('/verify-otp', payload)
  },
  async storeBasicInformation(tenantId: string, payload: any) {
    return Http.put(`/store-basic-information/${tenantId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
  async getTenantUser(tenantId: string) {
    return Http.get(`/tenant-user`, { params: { tenant_id: tenantId } })
  },
}
