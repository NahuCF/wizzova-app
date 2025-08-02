import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Tenant, UserItem } from '~/types'

export const useSessionStore = defineStore('session', () => {
	const user = ref<UserItem | null>(null)
	const tenant = ref<Tenant | null>(null)
	const tenants = ref<Tenant[]>([])
	const selectedTenant = ref<Tenant | null>(null)
	const savedEmail = ref<string>('')
	const token = ref<string>('')
	const showOverrideDialog = ref(false)

	const isAuthenticated = computed(() => {
		return user.value && tenant.value && token.value
	})

	const isOwner = computed(() => {
		return user.value?.role.name === 'Owner' && user.value.role.is_internal
	})

	const hasPermission = (permissionName: string) => {
		return !!user.value?.permission_names.find(permission => permission === permissionName)
	}

	const hasAllPermissions = (permissions: string[]) => {
		return permissions.every(permission => {
			return user.value?.permission_names.includes(permission)
		})
	}

	const hasAnyPermission = (permissions: string[]) => {
		return permissions.some(p => user.value?.permission_names.includes(p))
	}

	const $reset = () => {
		user.value = null
		tenant.value = null
		tenants.value = []
		selectedTenant.value = null
		savedEmail.value = ''
		token.value = ''
		showOverrideDialog.value = false
	}

	return {
		user,
		tenant,
		tenants,
		selectedTenant,
		savedEmail,
		token,
		showOverrideDialog,
		isAuthenticated,
		isOwner,
		hasPermission,
		hasAllPermissions,
		hasAnyPermission,
		$reset
	}
}, {
	persist: [
		{
			pick: ['user', 'tenant', 'token']
		}
	]
})