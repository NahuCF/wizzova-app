import { defineStore } from "pinia"
import { ref } from "vue"
import { API } from "~/services"
import type { WABAItem } from "~/types"

export const useWabaStore = defineStore('waba', () => {
	const wabas = ref<WABAItem[]>([])
	const loading = ref(false)
	const loaded = ref(false)

	const fetchWabas = async (businessId: string, force = false) => {
		if (loading.value || (loaded.value && !force)) return

		loading.value = true
		try {
			const response = await API.waba.index(businessId)
			wabas.value = response.data.data
			loaded.value = true
		} catch (error) {
			console.error('Failed to fetch WABAs:', error)
		} finally {
			loading.value = false
		}
	}

	const $reset = () => {
		wabas.value = []
		loading.value = false
		loaded.value = false
	}

	return {
		wabas,
		loading,
		fetchWabas,
		$reset
	}
})