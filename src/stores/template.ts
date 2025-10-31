import { defineStore } from "pinia"
import { ref } from "vue"
import { API } from "~/services"
import type { LayoutMode, TemplateItem } from "~/types"

export const useTemplateStore = defineStore('template', () => {
	const activeLayout = ref<LayoutMode>('GRID')
	const templates = ref<TemplateItem[]>()
	const loading = ref(false)
	const loaded = ref(false)

	const fetchTemplates = async (force = false) => {
			if (loading.value || (loaded.value && !force)) return
	
			loading.value = true
			try {
				const response = await API.template.index({})
				templates.value = response.data.data
				loaded.value = true
			} catch (error) {
				console.error('Failed to fetch teams:', error)
			} finally {
				loading.value = false
			}
		}

	const $reset = () => {
		activeLayout.value = 'GRID'
		templates.value = []
		loading.value = false
		loaded.value = false
	}

	return {
		activeLayout,
		templates,
		loading,
		loaded,
		$reset,
		fetchTemplates
	}
}, {
	persist: [
		{
			pick: ['activeLayout']
		}
	]
})