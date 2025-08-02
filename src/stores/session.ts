import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Tenant } from '~/types'
import type { User } from '~/types'

export const useSessionStore = defineStore('session', () => {
	const user = ref<User | null>(null)
	const tenant = ref<Tenant | null>(null)
	const tenants = ref<Tenant[]>([])
	const selectedTenant = ref<Tenant | null>(null)
	const savedEmail = ref<string>('')
	const token = ref<string>('')
	const showOverrideDialog = ref(false)

	const isAuthenticated = computed(() => {
		return user.value && tenant.value && token.value
	})

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
		$reset
	}
}, {
	persist: [
		{
			pick: ['user', 'tenant', 'token']
		}
	]
})