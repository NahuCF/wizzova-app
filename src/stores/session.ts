import { defineStore } from 'pinia'
import type { Tenant } from '~/types/Tenant'
import type { User } from '~/types/User'

export const useSessionStore = defineStore('session', {
  state: () => {
    return { user: {} as User, tenant: {} as Tenant, lastOtpSentAt: null as Date | null }
  },
  actions: {
    setTenant(tenant: Tenant) {
      this.tenant = tenant
    },
    setTenantVerified(verified: boolean) {
      this.tenant.verifiedEmail = verified
    },
    setUser(user: User) {
      this.user = user
    },
  },
  getters: {
    isTenantVerified(): boolean {
      return this.tenant.verifiedEmail
    },
    getTenant(): Tenant {
      return this.tenant
    },
  },
  persist: true,
})
