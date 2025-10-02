import { computed, onMounted, onBeforeUnmount, type Ref } from 'vue'
import { usePusher } from './usePusher'
import { useConversationStore } from '~/stores/conversations'
import { useSessionStore } from '~/stores'
import type { ConversationItem, MessageDelivered, MessageItem } from '~/types'
import type { Channel } from 'pusher-js'

export const useConversationChannels = (messages: Ref<{ data: MessageItem[] }>) => {
	const sessionStore = useSessionStore()
	const conversationStore = useConversationStore()
	
	const { subscribe, unsubscribe } = usePusher()
	let channel: Channel

	const conversations = computed({
		get: () => conversationStore.pagination.dataPage.data,
		set: (val) => (conversationStore.pagination.dataPage.data = val)
	})

	const selectedConversation = computed(() => conversationStore.selectedConversation)

	const playMessageSound = () => new Audio('/public/sounds/message.wav').play()

	const getConversationTab = (conversation: ConversationItem) => {
		if(!conversation.assigned_user) {
			return 'unassigned'
		}

		if(conversation.assigned_user.id === sessionStore.user?.id) {
			return 'mine'
		}

		if(!conversation.is_solved) {
			return 'opened'
		}

		if(!conversation.is_solved) {
			return 'resolved'
		}

		return null
	}

	const handleConversation = (conversation: ConversationItem) => {
		const existing = conversations.value.find(c => c.id === conversation.id)
		const conversationTab = getConversationTab(conversation)

		if (existing) {
			conversations.value = conversations.value.map(c =>
				c.id === existing.id 
					? { ...c, assigned_user: conversation.assigned_user }
					: c
			)
		} 
		else if (conversationTab === conversationStore.conversationTab) {
			conversations.value = [
				conversation,
				...conversations.value
			]
		}
	}

	const handleNewConversation = ({ conversation }: { conversation: ConversationItem }) => {
		if(!conversation.is_initiated) {
			playMessageSound()
		}

		handleConversation(conversation)
	}

	const handleOwnerChanged = ({ conversation }: { conversation: ConversationItem }) => {
		handleConversation(conversation)
	}

	const handleNewMessage = ({ message }: { message: MessageItem }) => {
		if (selectedConversation.value?.id === message.conversation_id &&
			!messages.value.data.find(m => m.id === message.id)) {
			playMessageSound()
			messages.value.data.push(message)
		}
	}

	const handleMessageDelivered = (delivered: MessageDelivered) => {
		conversationStore.fetchStats()
		if (delivered.conversation_id !== selectedConversation.value?.id) return

		messages.value.data = messages.value.data.map(message =>
			message.id === delivered.message_id
				? { ...message, status: delivered.status }
				: message
		)
	}

	onMounted(() => {
		if (!sessionStore.tenant || !sessionStore.defaultWaba) return

		const name = `private-tenant.${sessionStore.tenant.id}.waba.${sessionStore.defaultWaba.id}.conversation`
		channel = subscribe(name)

		channel.bind('conversation.new', handleNewConversation)
		channel.bind('conversation.owner.changed', handleOwnerChanged)
		channel.bind('message.new', handleNewMessage)
		channel.bind('message.delivered', handleMessageDelivered)
	})

	onBeforeUnmount(() => {
		if (channel) unsubscribe(channel.name)
	})

	return {
		messages
	}
}
