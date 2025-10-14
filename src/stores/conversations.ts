import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSessionStore } from './session'
import { API } from '~/services'
import type { 
	ConversationItem, Page, UserItem, 
	ConversationStatus, ConversationStats 
} from '~/types'
import type { ConversationFilters } from '~/services/ConversationService'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useOptimisticUpdate } from '~/composables/useOptimisticUpdate'

export const useConversationsStore = defineStore('conversations', () => {
	const sessionStore = useSessionStore()
	const handleError = useErrorHandler()
	const { optimisticUpdate } = useOptimisticUpdate()

	const conversationsByTab = ref<Record<ConversationStatus, ConversationItem[]>>({
		unassigned: [],
		mine: [],
		pinned: [],
		opened: [],
		resolved: [],
	})

	const paginationByTab = ref<Record<ConversationStatus, Page<ConversationItem> | null>>({
		unassigned: null,
		mine: null,
		pinned: null,
		opened: null,
		resolved: null,
	})

	const currentTab = ref<ConversationStatus>('mine')
	const loading = ref(false)
	const selectedConversation = ref<ConversationItem | null>(null)
	const changingSolved = ref(false)
	const changingOwner = ref(false)
	const stats = ref<ConversationStats>({
		unassigned: 0,
		mine: 0,
		opened: 0,
		resolved: 0,
		pinned: 0
	})

	const tabToFilters = (tab: ConversationStatus) => {
		switch (tab) {
			case 'unassigned': return { only_unassigned: true }
			case 'mine': return sessionStore.user ? { user_id: sessionStore.user.id } : {}
			case 'pinned': return { only_pinned: true }
			case 'opened': return { only_opened: true }
			case 'resolved': return { only_solved: true }
		}
	}

	const fetchConversations = async (
		tab: ConversationStatus = currentTab.value,
		page = 1,
		filters?: ConversationFilters
	) => {
		loading.value = true
		try {
			const requestFilters = {
				page,
				rows_per_page: 20,
				...tabToFilters(tab),
				...filters
			}

			const { data: response } = await API.conversation.index(requestFilters)

			conversationsByTab.value[tab] = page === 1
				? response.data
				: [...conversationsByTab.value[tab], ...response.data]

			paginationByTab.value[tab] = response
		} catch(error) {
			handleError(error)
		} finally {
			loading.value = false
		}
	}

	const fetchStats = async () => {
		try {
			const { data: response } = await API.conversation.stats(currentTab.value)
			stats.value = response.data
		} catch (error) {
			console.error(error)
		}
	}

	const loadNextPage = async (tab: ConversationStatus = currentTab.value) => {
		const pag = paginationByTab.value[tab]
		if (!pag || pag.meta.current_page >= pag.meta.last_page) return
		await fetchConversations(tab, pag.meta.current_page + 1)
	}

	const setTab = async (tab: ConversationStatus) => {
		currentTab.value = tab

		if (!paginationByTab.value[tab]) {
			await fetchConversations(tab, 1)
		}

		if(tab !== 'pinned') {
			await fetchStats()
		}
	}

	const selectConversation = (conv: ConversationItem | null) => {
		selectedConversation.value = conv
	}

	const changeOwner = async (conversation: ConversationItem, newOwner?: UserItem) => {
		if (!conversation || !newOwner) return
		changingOwner.value = true
		try {
			const ownerId = newOwner && newOwner.id !== 'not_assigned' ? newOwner.id : undefined
			const isUnassigned = !ownerId
			const isAssignedToCurrentUser = ownerId && sessionStore.user?.id === ownerId

			const { data: response } = await API.conversation.changeOwner(conversation.id, ownerId)
			const updatedConversation = response.data

			for (const tab of Object.keys(conversationsByTab.value) as ConversationStatus[]) {
				conversationsByTab.value[tab] = conversationsByTab.value[tab].filter(
					c => c.id !== conversation.id
				)
			}

			if (isUnassigned) {
				conversationsByTab.value.unassigned.unshift(updatedConversation)
				selectedConversation.value = null
			} else if (isAssignedToCurrentUser) {
				conversationsByTab.value.mine.unshift(updatedConversation)
				if (!updatedConversation.is_solved) {
					conversationsByTab.value.opened.unshift(updatedConversation)
				}
			} else if (!updatedConversation.is_solved) {
				conversationsByTab.value.opened.unshift(updatedConversation)
			}

			updateConversationInTabs(updatedConversation, ['pinned'])

			if (selectedConversation.value?.id === updatedConversation.id) {
				selectedConversation.value = updatedConversation
			}

			await fetchStats()
		} catch(error) {
			handleError(error)
		} finally {
			changingOwner.value = false
		}
	}

	const changeSolved = async (conversation: ConversationItem, solved: boolean) => {
		if (!conversation) return
		changingSolved.value = true
		try {
			const { data: response } = await API.conversation.changeSolved(conversation.id, solved)
			const updatedConversation = {
				...conversation,
				...response.data
			}

			conversationsByTab.value.mine = conversationsByTab.value.mine.filter(
				(c) => c.id !== updatedConversation.id
			)
			conversationsByTab.value.opened = conversationsByTab.value.opened.filter(
				(c) => c.id !== updatedConversation.id
			)
			conversationsByTab.value.resolved = conversationsByTab.value.resolved.filter(
				(c) => c.id !== updatedConversation.id
			)

			if (updatedConversation.is_solved) {
				conversationsByTab.value.resolved.unshift(updatedConversation)
			} 
			else if(updatedConversation.assigned_user?.id === sessionStore.user?.id) {
				conversationsByTab.value.mine.unshift(updatedConversation)
				conversationsByTab.value.opened.unshift(updatedConversation)
			}
			else {
				conversationsByTab.value.opened.unshift(updatedConversation)
			}

			updateConversationInTabs(updatedConversation, ['pinned'])

			selectedConversation.value = null

    		await fetchStats()
		} catch(error) {
			handleError(error)
		} finally {
			changingSolved.value = false
		}
	}

	const updateConversationInTabs = (conversation: ConversationItem, tabs: ConversationStatus[]) => {
		for (const tab of tabs) {
			const index = conversationsByTab.value[tab].findIndex(c => c.id === conversation.id)
			if (index >= 0) {
				conversationsByTab.value[tab][index] = {
					...conversationsByTab.value[tab][index],
					...conversation
				}
			}
		}
	}

	const pin = async (conversation: ConversationItem) => {
		optimisticUpdate({
			key: conversation.id,
			type: 'pin',
			applyOptimistic: () => {
				const updated = { ...conversation, is_pinned: true }
				conversationsByTab.value.pinned.unshift(updated)
				updateConversationInTabs(updated, ['mine', 'opened', 'resolved', 'unassigned'])
				return updated
			},
			rollback: () => {
				conversationsByTab.value.pinned = conversationsByTab.value.pinned.filter(c => c.id !== conversation.id)
				return conversation
			},
			apiCall: async () => {
				const { data: response } =  await API.conversation.pin(conversation.id)
				return {
					...conversation,
					...response.data
				}
			}
		})
	}

	const unpin = async (conversation: ConversationItem) => {
		optimisticUpdate({
			key: conversation.id,
			type: 'unpin',
			applyOptimistic: () => {
				conversationsByTab.value.pinned = conversationsByTab.value.pinned.filter(c => c.id !== conversation.id)
				const updated = { ...conversation, is_pinned: false }
				updateConversationInTabs(updated, ['mine', 'opened', 'resolved', 'unassigned'])
				return updated
			},
			rollback: () => {
				conversationsByTab.value.pinned.unshift(conversation)
				return conversation
			},
			apiCall: async () => {
				const { data: response } =  await API.conversation.unpin(conversation.id)
				return {
					...conversation,
					...response.data
				}
			}
		})
	}

	const $reset = () => {
		conversationsByTab.value = {
			unassigned: [],
			mine: [],
			pinned: [],
			opened: [],
			resolved: [],
		}

		paginationByTab.value = {
			unassigned: null,
			mine: null,
			pinned: null,
			opened: null,
			resolved: null,
		}

		currentTab.value = 'mine'
		loading.value = false
		selectedConversation.value = null
		changingSolved.value = false
		changingOwner.value = false
		stats.value = {
			unassigned: 0,
			mine: 0,
			opened: 0,
			resolved: 0,
			pinned: 0
		}
	}

	return {
		conversationsByTab,
		paginationByTab,
		currentTab,
		loading,
		selectedConversation,
		changingSolved,
		changingOwner,
		stats,
		$reset,
		setTab,
		fetchConversations,
		loadNextPage,
		selectConversation,
		changeOwner,
		changeSolved,
		pin,
		unpin,
		fetchStats,
		updateConversationInTabs
	}
})
