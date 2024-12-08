import Http from '~/config/http'

export default {
  async login(email: string, password: string) {
    return Http.post('/login', { email, password })
  },
  async register(data: any) {
    return Http.post('/register', data)
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
}
