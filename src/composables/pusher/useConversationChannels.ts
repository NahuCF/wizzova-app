import { computed, onMounted, onBeforeUnmount } from 'vue'
import { usePusher } from './usePusher'
import { useConversationsStore } from '~/stores/conversations'
import { useSessionStore } from '~/stores'
import { useMessagesStore } from '~/stores/messages'
import type { ConversationItem, MessageDelivered, MessageItem, MessageStatus } from '~/types'
import type { Channel } from 'pusher-js'

export const useConversationChannels = () => {
	const sessionStore = useSessionStore()
	const conversationStore = useConversationsStore()
	const messagesStore = useMessagesStore()
	const { subscribe, unsubscribe } = usePusher()
	let channel: Channel

	const currentTab = computed(() => conversationStore.currentTab)
	const conversationsByTab = computed(() => conversationStore.conversationsByTab)

	const playMessageSound = () => new Audio('/public/sounds/message.wav').play()

	const getConversationTab = (conversation: ConversationItem) => {
		if (!conversation.assigned_user) return 'unassigned'
		if (conversation.assigned_user.id === sessionStore.user?.id) return 'mine'
		if (!conversation.is_solved) return 'opened'
		return 'resolved'
	}

	const upsertConversationInTab = (conversation: ConversationItem) => {
		const tab = getConversationTab(conversation)
		const conversations = conversationsByTab.value[tab] || []

		const index = conversations.findIndex(c => c.id === conversation.id)
		if (index >= 0) {
			conversations[index] = { ...conversations[index], ...conversation }
		} else if (tab === currentTab.value) {
			conversationsByTab.value[tab] = [conversation, ...conversations]
		}
	}

	const upsertMessage = (convId: string, message: MessageItem) => {
		const pag = messagesStore.initConversationPagination(convId)
		const firstPageKey = Number(Object.keys(pag.pages)[0] ?? 1)

		if (!pag.pages[firstPageKey]) pag.pages[firstPageKey] = []
		const page = pag.pages[firstPageKey]

		const index = page.findIndex(m => m.id === message.id)
		if (index >= 0) {
			page[index] = { ...page[index], ...message }
		} else {
			page.unshift(message)
		}
	}

	const updateMessageStatus = (convId: string, messageId: string, status: MessageStatus) => {
		const pag = messagesStore.initConversationPagination(convId)

		for (const messages of Object.values(pag.pages)) {
			const index = messages.findIndex(m => m.id === messageId)
			if (index >= 0) {
				messages[index] = { ...messages[index], status }
				break
			}
		}
	}

	const handleNewConversation = ({ conversation }: { conversation: ConversationItem }) => {
		if (!conversation.is_initiated) playMessageSound()
		upsertConversationInTab(conversation)
	}

	const handleOwnerChanged = ({ conversation }: { conversation: ConversationItem }) => {
		upsertConversationInTab(conversation)
	}

	const handleNewMessage = ({ message }: { message: MessageItem }) => {
		if(message.direction === 'inbound') {
			playMessageSound()
		}
		upsertMessage(message.conversation_id, message)
	}

	const handleMessageSent = ({ message }: { message: MessageItem }) => {
		upsertMessage(message.conversation_id, message)
	}

	const handleMessageDelivered = (delivered: MessageDelivered) => {
		updateMessageStatus(delivered.conversation_id, delivered.message_id, delivered.status)
	}

	// --- Pusher lifecycle ---
	onMounted(() => {
		if (!sessionStore.tenant || !sessionStore.defaultWaba) return

		const name = `private-tenant.${sessionStore.tenant.id}.waba.${sessionStore.defaultWaba.id}.conversation`
		channel = subscribe(name)

		channel.bind('conversation.new', handleNewConversation)
		channel.bind('conversation.owner.changed', handleOwnerChanged)
		channel.bind('message.new', handleNewMessage)
		channel.bind('message.sent', handleMessageSent)
		channel.bind('message.delivered', handleMessageDelivered)
	})

	onBeforeUnmount(() => {
		if (channel) unsubscribe(channel.name)
	})
}
