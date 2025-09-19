import { onMounted, onBeforeUnmount } from 'vue'
import { usePusher } from './usePusher'

export const useConversationChannels = (
	session: { token: string, tenantId: string, wabaId: string },
	handlers: {
		onNewConversation: (data: any) => void
		onOwnerChanged: (data: any) => void
		onNewMessage: (data: any) => void
		onMessageDelivered: (data: any) => void
	}
) => {
	const { subscribe, unsubscribe } = usePusher(session)
	let channel: any

	onMounted(() => {
		const name = `private-tenant.${session.tenantId}.waba.${session.wabaId}.conversation`
		channel = subscribe(name)
		channel.bind('conversation.new', handlers.onNewConversation)
		channel.bind('conversation.owner.changed', handlers.onOwnerChanged)
		channel.bind('message.new', handlers.onNewMessage)
		channel.bind('message.delivered', handlers.onMessageDelivered)
	})

	onBeforeUnmount(() => channel && unsubscribe(channel.name))
}