import { defineStore } from "pinia"
import { ref, watch } from "vue"
import { usePaginatedData } from "~/composables/usePaginatedData"
import { API } from "~/services"
import type { ConversationItem, ConversationStats, ConversationStatus, UserItem } from "~/types"
import { useSessionStore } from "./session"
import { useErrorHandler } from "~/composables/useErrorHandler"
import { useUserStore } from "./user"

export const useConversationStore = defineStore('conversation', () => {
	const sessionStore = useSessionStore()
	const userStore = useUserStore()
	const handleError = useErrorHandler()

	const stats = ref<ConversationStats>({
		unassigned: 0,
		mine: 0,
		opened: 0,
		resolved: 0
	})
	const conversationTab = ref<ConversationStatus>('mine')
	const searchType = ref<'contact' | 'message'>('contact')
	const selectedConversation = ref<ConversationItem>()
	const changingSolved = ref(false)
	const changingOwner = ref(false)

	const {
		dataPage,
		loading,
		rowsPerPage,
		searchTerm,
		fetchDataPage,
		loadNextPage,
		debouncedFetch
	} = usePaginatedData<ConversationItem>(
		(page, rows_per_page, search) => {
			const statusFilter = {
				unassigned: { only_unassigned: true },
				mine: sessionStore.user && { user_id: sessionStore.user?.id },
				mentioned: sessionStore.user && { user_id: sessionStore.user?.id, only_pinned: true },
				opened: { only_opened: true },
				resolved: { only_solved: true }
			}

			return API.conversation.index({
				page,
				rows_per_page,
				search,
				search_type: search ? searchType.value : undefined,
				...statusFilter[conversationTab.value]
			}).then(res => res.data)
		},
		15
	)

	const fetchStats = async () => {
		try {
			const { data: response} = await API.conversation.stats(conversationTab.value)
			stats.value = response.data
		} catch(error) {
			console.log(error)
		}
	}

	const changeOwner = async (newOwner?: UserItem) => {
		if(!selectedConversation.value || !newOwner) return

		changingOwner.value = true
		try {
			const ownerId = newOwner.id !== 'not_assigned' ? newOwner.id : undefined

			const { data: response } = await API.conversation.changeOwner(selectedConversation.value.id, ownerId)
			selectedConversation.value = {
				...selectedConversation.value,
				...response.data
			}

			fetchDataPage()
			fetchStats()
		} catch(error) {
			handleError(error)
		} finally {
			changingOwner.value = false
		}
	}

	const changeSolved = async (solved: boolean) => {
		if(!selectedConversation.value) return

		changingSolved.value = true
		try {
			const { data: response } = await API.conversation.changeSolved(selectedConversation.value.id, solved)
			selectedConversation.value = {
				...selectedConversation.value,
				...response.data
			}

			fetchDataPage()
			fetchStats()
		} finally {
			changingSolved.value = false
		}
	}

	watch([searchTerm, searchType], () => debouncedFetch())

	watch(conversationTab, () => {
		searchTerm.value = ''
		fetchDataPage()
		fetchStats()
	})

	watch(() => selectedConversation.value?.assigned_user, () => {
		if(selectedConversation.value && !selectedConversation.value?.assigned_user) {
			selectedConversation.value.assigned_user = { ...userStore.notAssigned }
		}
	})

	const $reset = () => {
		dataPage.value.data = []
		searchTerm.value = ''

		stats.value = {
			unassigned: 0,
			mine: 0,
			opened: 0,
			resolved: 0
		}
		conversationTab.value = 'mine'
		searchType.value = 'contact'
		selectedConversation.value = undefined
		changingSolved.value = false
		changingOwner.value = false
	}

	return {
		stats,
		pagination: {
			dataPage,
			loading,
			rowsPerPage,
			searchTerm,
			fetchDataPage,
			loadNextPage,
			debouncedFetch
		},
		conversationTab,
		searchType,
		selectedConversation,
		changingSolved,
		changingOwner,
		fetchStats,
		changeSolved,
		changeOwner,
		$reset
	}
})