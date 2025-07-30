import { defineStore } from 'pinia'
import type { Tenant } from '~/types/Tenant'
import type { User } from '~/types/User'

interface SessionState {
  user: User | null,
  tenant: Tenant | null
}

export const useSessionStore = defineStore('session', {
  state: (): SessionState => {
    return { user: null, tenant: null }
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
      return this.user?.id != null && this.tenant?.id != null && this.tenant.token !== null
    },
    isTenantVerified(): boolean {
      return Boolean(this.tenant?.verifiedEmail)
    },
    getTenant(): Tenant | null {
      return this.tenant
    },
  },
  persist: true,
})
