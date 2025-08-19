import { defineStore } from "pinia"
import { ref } from "vue"
import type { LayoutMode } from "~/types"

export const useTemplateStore = defineStore('template', () => {
	const activeLayout = ref<LayoutMode>('GRID')

	const $reset = () => {
		activeLayout.value = 'GRID'
	}

	return {
		activeLayout,
		$reset
	}
}, {
	persist: true
})