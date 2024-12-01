import { defineStore } from 'pinia'
import type { Tenant } from '~/types/Tenant'

export const useSessionStore = defineStore('session', {
  state: () => {
    return { user: {}, tenant: {} as Tenant }
  },
  actions: {
    setTenant(tenant: Tenant) {
      this.tenant = tenant
    },
  },
  persist: true,
})
