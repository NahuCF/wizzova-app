import { defineStore } from 'pinia'
import type { Tenant } from '~/types/Tenant'
import type { User } from '~/types/User'

export const useSessionStore = defineStore('session', {
  state: () => {
    return { user: {} as User, tenant: {} as Tenant }
  },
  actions: {
    setTenant(tenant: Tenant) {
      this.tenant = tenant
    },
    setUser(user: User) {
      this.user = user
    },
  },
  getters: {
    isAuthenticated(): boolean {
      return this.user.id != null && this.tenant.id != null && this.tenant.token !== null
    },
    isTenantVerified(): boolean {
      return this.tenant.verifiedEmail
    },
    getTenant(): Tenant {
      return this.tenant
    },
  },
  persist: true,
})
