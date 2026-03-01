import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Tenant, UserItem, WABANumber } from '~/types'

export const useSessionStore = defineStore(
  'session',
  () => {
    const user = ref<UserItem | null>(null)
    const tenant = ref<Tenant | null>(null)
    const tenants = ref<Tenant[]>([])
    const selectedTenant = ref<Tenant | null>(null)
    const savedEmail = ref<string>('')
    const wabaNumbers = ref<WABANumber[]>([])
    const createNumber = ref(false)
    const token = ref<string>('')
    const showOverrideDialog = ref(false)

    const isAuthenticated = computed(() => {
      return user.value && tenant.value && token.value
    })

    const isOwner = computed(() => {
      return user.value?.role.name === 'Owner' && user.value.role.is_internal
    })

    const defaultWaba = computed(() => {
      return user.value?.default_waba
    })

    const subscription = computed(() => {
      return tenant.value?.subscription
    })

    const hasProOrScalePlan = computed(() => {
      const plan = subscription.value?.plan_type
      return plan === 'scale' || plan === 'pro'
    })

    const hasPremiumAccess = computed(() => {
      return hasProOrScalePlan.value
    })

    const hasPermission = (permissionName: string) => {
      return !!user.value?.permission_names.find((permission) => permission === permissionName)
    }

    const hasAllPermissions = (permissions: string[]) => {
      return permissions.every((permission) => {
        return user.value?.permission_names.includes(permission)
      })
    }

    const hasAnyPermission = (permissions: string[]) => {
      return permissions.some((p) => user.value?.permission_names.includes(p))
    }

    const updateUser = (updatedUser: Partial<UserItem>) => {
      if (user.value) {
        user.value = { ...user.value, ...updatedUser }
      }
    }

    const $reset = () => {
      user.value = null
      tenant.value = null
      tenants.value = []
      selectedTenant.value = null
      savedEmail.value = ''
      wabaNumbers.value = []
      createNumber.value = false
      token.value = ''
      showOverrideDialog.value = false
    }

    return {
      user,
      tenant,
      tenants,
      selectedTenant,
      savedEmail,
      wabaNumbers,
      createNumber,
      token,
      showOverrideDialog,
      isAuthenticated,
      isOwner,
      defaultWaba,
      subscription,
      hasProOrScalePlan,
      hasPremiumAccess,
      hasPermission,
      hasAllPermissions,
      hasAnyPermission,
      updateUser,
      $reset,
    }
  },
  {
    persist: [
      {
        pick: ['user', 'tenant', 'token'],
      },
    ],
  },
)
