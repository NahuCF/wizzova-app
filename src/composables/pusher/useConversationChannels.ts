import { computed, onMounted, onBeforeUnmount } from 'vue'
import { usePusher } from './usePusher'
import { useConversationsStore } from '~/stores/conversations'
import { useSessionStore } from '~/stores'
import { useMessagesStore } from '~/stores/messages'
import type { ConversationItem, MessageDeleted, MessageDelivered, MessageItem, MessageStatus } from '~/types'
import type { Channel } from 'pusher-js'

export const useConversationChannels = () => {
	const sessionStore = useSessionStore()
	const conversationStore = useConversationsStore()
	const messagesStore = useMessagesStore()
	const { subscribe, unsubscribe } = usePusher()
	const notificationAudio = new Audio('/public/sounds/message.wav')
	notificationAudio.autoplay = false
	notificationAudio.preload = 'auto'
	let channel: Channel

	const playMessageSound = () => {
		notificationAudio.currentTime = 0
		notificationAudio.play()
	}

	const upsertMessage = async (convId: string, message: MessageItem) => {
		const pag = messagesStore.initConversationPagination(convId)
		const firstPageKey = Number(Object.keys(pag.pages)[0] ?? 1)

		if (!pag.pages[firstPageKey]) pag.pages[firstPageKey] = []
		const page = pag.pages[firstPageKey]

		const index = page.findIndex(m => m.id === message.id)
		if (index >= 0) {
			page[index] = { ...page[index], ...message }
		} else {
			playMessageSound()
			page.unshift(message)
			await conversationStore.updateConversationWithMessage(message)

			const conversation = conversationStore.findConversationById(convId)
			if (conversation) {
				conversationStore.incrementStatsFromMessage(conversation)
			}
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
		if(!conversationStore.findConversationById(conversation.id)) {
			playMessageSound()
		}

		conversationStore.incrementStatsForConversation(conversation)
		conversationStore.insertConversationIntoTabs(conversation)
	}

	const handleOwnerChanged = ({ conversation }: { conversation: ConversationItem }) => {
		const oldConv = conversationStore.findConversationById(conversation.id)
		const prevOwnerId = oldConv?.assigned_user?.id
		const newOwnerId = conversation.assigned_user?.id

		conversationStore.updateStatsForOwnerChange(prevOwnerId, newOwnerId)
		conversationStore.insertConversationIntoTabs(conversation)
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

	const handleMessageDeleted = (deleted: MessageDeleted) => {
		updateMessageStatus(deleted.conversation_id, deleted.message_id, 'deleted')
		messagesStore.lastDeletedMessage = deleted
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
		channel.bind('message.deleted', handleMessageDeleted)
	})

	onBeforeUnmount(() => {
		if (channel) unsubscribe(channel.name)
	})
}
