import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useSessionStore } from './session'
import { API } from '~/services'
import type { 
	ConversationItem, Page, UserItem, 
	ConversationStatus, ConversationStats, 
	MessageItem
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
	const statsLoaded = ref(false)

	const totalUnreadCount = computed(() => {
		const allConversations = Object.values(conversationsByTab.value).flat()
		const uniqueConversations = new Map<string, number>()

		for (const conv of allConversations) {
			if (!uniqueConversations.has(conv.id)) {
			uniqueConversations.set(conv.id, conv.unread_count || 0)
			}
		}

		let total = 0
		for (const count of uniqueConversations.values()) {
			total += count
		}

		return total
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

	const fetchStats = async (force = false) => {
		if (statsLoaded.value && !force) return

		try {
			const { data: response } = await API.conversation.stats(currentTab.value)
			stats.value = response.data
			statsLoaded.value = true
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
			await fetchStats(stats.value[currentTab.value] > 0)
		}
	}

	const selectConversation = (conv: ConversationItem | null) => {
		selectedConversation.value = conv

		if(conv) {
			conv = {
				...conv,
				unread_count: 0
			}
			insertConversationIntoTabs(conv)
		}
	}

	const getConversationTabs = (conversation: ConversationItem): ConversationStatus[]  => {
		let tabs: ConversationStatus[] = []

		if (!conversation.assigned_user && !conversation.is_solved) {
			tabs = [ ...tabs, 'unassigned' ]
		}
		if (conversation.assigned_user?.id === sessionStore.user?.id) {
			tabs = [ ...tabs, 'mine' ]
		}
		if (!conversation.is_expired && !conversation.is_solved) {
			tabs = [ ...tabs, 'opened' ]
		}
		if (conversation.is_expired || conversation.is_solved) {
			tabs = [ ...tabs, 'resolved' ]
		}
		if (conversationsByTab.value['pinned'].find(c => c.id === conversation.id)) {
			tabs = [ ...tabs, 'pinned' ]
		}

		return tabs
	}

	const findConversationById = (id: string): ConversationItem | undefined => {
		for (const tab of Object.values(conversationsByTab.value)) {
			const found = tab.find(c => c.id === id)
			if (found) return found
		}
		return undefined
	}

	const removeConversationFromAllTabs = (conversationId: string) => {
		for (const tab of Object.keys(conversationsByTab.value) as ConversationStatus[]) {
			conversationsByTab.value[tab] = conversationsByTab.value[tab].filter(
				c => c.id !== conversationId
			)
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

	const insertConversationIntoTabs = (conversation: ConversationItem) => {
		const tabs = getConversationTabs(conversation)
		if (!tabs.length) return

		const oldConv = findConversationById(conversation.id)
		const updatedConv = oldConv 
			? {
				...oldConv,
				...conversation
			}
			: conversation

		removeConversationFromAllTabs(conversation.id)

		for (const tab of tabs) {
			conversationsByTab.value[tab].unshift(updatedConv)
		}
		
		if(selectedConversation.value?.id === updatedConv.id) {
			selectedConversation.value = updatedConv
		}
	}
	
	const updateConversationWithMessage = (message: MessageItem, read?: boolean) => {
		const conv = findConversationById(message.conversation_id)
		if (!conv) return

		const updatedConv: ConversationItem = {
			...conv,
			unread_count: read ? conv.unread_count : conv.unread_count + 1,
			last_message: message,
			last_message_at: message.created_at,
		}

		insertConversationIntoTabs(updatedConv)
	}

	const incrementStat = (key: keyof ConversationStats) => {
		stats.value[key]++
	}

	const decrementStat = (key: keyof ConversationStats) => {
		stats.value[key] = Math.max(0, stats.value[key] - 1)
	}

	const refreshStats = async () => {
		statsLoaded.value = false
		await fetchStats(true)
	}

	const incrementStatsForConversation = (conversation: ConversationItem) => {
		const tabs = getConversationTabs(conversation)
		if (!tabs.length) return

		for (const tab of tabs) {
			const exists = conversationsByTab.value[tab].some(c => c.id === conversation.id)
			if (!exists && stats.value[tab] !== undefined) {
				incrementStat(tab)
			}
		}
	}

	const updateStatsForOwnerChange = (
		prevOwnerId: string | undefined,
		newOwnerId: string | undefined
	) => {
		const currentUserId = sessionStore.user?.id

		if (!prevOwnerId) decrementStat('unassigned')
		else if (prevOwnerId === currentUserId) decrementStat('mine')

		if (!newOwnerId) incrementStat('unassigned')
		else if (newOwnerId === currentUserId) incrementStat('mine')
	}

	const updateStatsForSolvedChange = (
		wasSolved: boolean,
		isSolved: boolean,
		assignedUserId?: string
	) => {
		const currentUserId = sessionStore.user?.id

		if (!wasSolved && isSolved) {
			incrementStat('resolved')
			if (assignedUserId === currentUserId) decrementStat('mine')
			else decrementStat('opened')
		}

		if (wasSolved && !isSolved) {
			decrementStat('resolved')
			if (assignedUserId === currentUserId) incrementStat('mine')
			else incrementStat('opened')
		}
	}

	const changeOwner = async (conversation: ConversationItem, newOwner?: UserItem) => {
		if (!conversation || !newOwner) return
		changingOwner.value = true
		try {
			const prevOwnerId = conversation.assigned_user?.id
			const newOwnerId = newOwner.id !== 'not_assigned' ? newOwner.id : undefined

			const { data: response } = await API.conversation.changeOwner(conversation.id, newOwnerId)
			const updatedConversation = response.data

			insertConversationIntoTabs(updatedConversation)

			if (selectedConversation.value?.id === updatedConversation.id) {
				selectConversation(newOwnerId ? updatedConversation : null)
			}

			updateStatsForOwnerChange(prevOwnerId, newOwnerId)
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
			const wasSolved = conversation.is_solved
			const { data: response } = await API.conversation.changeSolved(conversation.id, solved)
			const updatedConversation = { ...conversation, ...response.data }

			insertConversationIntoTabs(updatedConversation)
			selectConversation(null)

			updateStatsForSolvedChange(
				wasSolved,
				updatedConversation.is_solved,
				updatedConversation.assigned_user?.id
			)
		} catch(error) {
			handleError(error)
		} finally {
			changingSolved.value = false
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
		changingSolved.value = false
		changingOwner.value = false
		stats.value = {
			unassigned: 0,
			mine: 0,
			opened: 0,
			resolved: 0,
			pinned: 0
		}

		selectConversation(null)
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
		totalUnreadCount,
		$reset,
		setTab,
		fetchConversations,
		loadNextPage,
		selectConversation,
		changeOwner,
		changeSolved,
		pin,
		unpin,
		refreshStats,
		updateConversationInTabs,
		getConversationTabs,
		findConversationById,
		updateStatsForOwnerChange,
		removeConversationFromAllTabs,
		insertConversationIntoTabs,
		incrementStatsForConversation,
		updateConversationWithMessage
	}
})
