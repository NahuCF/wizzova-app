import { defineStore } from "pinia"
import { ref } from "vue"
import { API } from "~/services"
import type { ConversationStats, ConversationStatus } from "~/types"

export const useConversationStore = defineStore('conversation', () => {
	const stats = ref<ConversationStats>({
		unassigned: 0,
		mine: 0,
		opened: 0,
		resolved: 0
	})

	const fetchStats = async (status: ConversationStatus) => {
		try {
			const { data: response} = await API.conversation.stats(status)
			stats.value = response.data
		} catch(error) {
			console.log(error)
		}
	}

	const $reset = () => {
		stats.value = {
			unassigned: 0,
			mine: 0,
			opened: 0,
			resolved: 0
		}
	}

	return {
		stats,
		fetchStats,
		$reset
	}
})