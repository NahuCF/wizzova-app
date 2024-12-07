import { defineStore } from 'pinia'
import type { Tenant } from '~/types/Tenant'

export const useSessionStore = defineStore('session', {
  state: () => {
    return { user: {}, tenant: {} as Tenant, lastOtpSentAt: null as Date | null }
  },
  actions: {
    setTenant(tenant: Tenant) {
      this.tenant = tenant
    },
    setTenantVerified(verified: boolean) {
      this.tenant.verifiedEmail = verified
    },
  },
  getters: {
    isTenantVerified(): boolean {
      return this.tenant.verifiedEmail
    },
  },
  persist: true,
})
