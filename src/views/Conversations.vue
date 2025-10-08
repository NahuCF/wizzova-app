<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useConversationChannels } from '~/composables/pusher/useConversationChannels'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useUserStore } from '~/stores/user'
import { useConversationsStore } from '~/stores/conversations'
import { useMessagesStore } from '~/stores/messages'
import type {
	ConversationItem, CreateMessage,
	ContactItem, ConversationActivity
} from '~/types'
import Chat from '~/components/common/Chat.vue'

const conversationStore = useConversationsStore()
const messagesStore = useMessagesStore()
const userStore = useUserStore()
const handleError = useErrorHandler()
const { getContactName, getContactPhone } = useContactUtils()

const {
	selectedConversation,
	changingSolved,
	changingOwner,
	currentTab,
	conversationsByTab,
	stats
} = storeToRefs(conversationStore)

const showStartConversationDialog = ref(false)
const showTemplateDialog = ref(false)
const sendingMessage = ref(false)
const activities = ref<ConversationActivity[]>([])
const searchingContact = ref(false)
const chatRef = ref<InstanceType<typeof Chat> | null>(null)

const messages = computed(() => {
	if (!selectedConversation.value) return []
	return messagesStore.getMessagesForConversation(selectedConversation.value.id)
})

const disableReply = computed(() =>
	!selectedConversation.value ||
	selectedConversation.value.is_solved ||
	selectedConversation.value.is_expired ||
	!selectedConversation.value.is_initiated
)

const startConversation = (conversation: ConversationItem) => {
	showStartConversationDialog.value = false
	conversationStore.selectConversation(conversation)
	messagesStore.loadInitialPage(conversation.id)
}

const navigateToConversation = async (conversationId: string) => {
	const tabConvs = conversationsByTab.value[currentTab.value] || []
	const index = tabConvs.findIndex(c => c.id === conversationId)
	if (index >= 0) {
		const first = tabConvs[0]
		tabConvs[0] = tabConvs[index]
		tabConvs[index] = first
		conversationStore.selectConversation(tabConvs[0])
		messagesStore.loadInitialPage(tabConvs[0].id)
		return
	}

	try {
		const { data: response } = await API.conversation.get(conversationId)
		tabConvs.unshift(response.data)
		conversationStore.selectConversation(tabConvs[0])
		messagesStore.loadInitialPage(tabConvs[0].id)
	} catch (error) {
		handleError(error)
	}
}

const updateContact = (contact: ContactItem) => {
	if (!selectedConversation.value) return
	selectedConversation.value = { ...selectedConversation.value, contact }
	const tabConvs = conversationsByTab.value[currentTab.value] || []
	conversationsByTab.value[currentTab.value] = tabConvs.map(c =>
		c.id === selectedConversation.value?.id ? { ...c, contact } : c
	)
}

const sendTextMessage = async ({ message, type, mentions, replyId }: {
	message: string,
	type: 'REPLY' | 'NOTES',
	mentions: Record<string, string>[],
	replyId?: string
}) => {
	if (!selectedConversation.value) return

	const newMessage: CreateMessage = {
		conversation_id: selectedConversation.value.id,
		type: type === 'REPLY' ? 'text' : 'note',
		to_phone: '',
		content: message,
		mentions: mentions.length ? mentions : undefined,
	}
	if (replyId) newMessage.reply_to_message_id = replyId
	await sendMessage(newMessage)
}

const sendMessage = async (newMessage: CreateMessage) => {
	if (!selectedConversation.value) return
	const contactPhone = getContactPhone(selectedConversation.value.contact)
	if (!contactPhone) return

	newMessage.to_phone = contactPhone
	sendingMessage.value = true
	try {
		const { data: response } = await API.message.create(newMessage)
		const convId = selectedConversation.value.id

		messagesStore.ensurePage(convId, 1) // insert at first page
		messagesStore.messagesPaginationByConversation[convId].pages[1].unshift(response.data)

		if (response.data.template_id) {
			await messagesStore.ensureTemplatesForMessages([response.data])
		}

		if (!selectedConversation.value.is_initiated) {
			selectedConversation.value.is_initiated = true
			fetchActivities()
		}
	} catch (error) {
		handleError(error)
	} finally {
		sendingMessage.value = false
	}
}

const fetchActivities = async () => {
	if (!selectedConversation.value) return
	try {
		const { data: response } = await API.conversation.activities(selectedConversation.value.id)
		activities.value = response.data
	} catch (error) {
		handleError(error)
	}
}

const loadMoreMessages = async () => {
	if (!selectedConversation.value) return
	await messagesStore.loadOlderMessages(selectedConversation.value.id)
}

const handleScrollToMessage = ({ messageId, page, positionFromEnd }: { messageId: string, page: number, positionFromEnd: number }) => {
  	chatRef.value?.scrollToMessage(messageId)
}

watch(selectedConversation, (conv) => {
	if (conv) {
		messagesStore.loadInitialPage(conv.id)
		fetchActivities()
	}
})


selectedConversation.value = null
userStore.fetchUsers()
conversationStore.fetchStats()
conversationStore.fetchConversations()
useConversationChannels()
</script>

<template>
	<div class="grid grid-cols-5 h-full">
		<ConversationsPanel
			@onStartConversation="startConversation"
			@navigateToConversation="navigateToConversation"
		/>

		<div v-if="!selectedConversation" class="col-span-4 flex flex-col justify-center items-center h-full gap-4">
			<div class="text-[1.6rem] font-bold">{{ $t('conversations.select_conversation') }}</div>
			<div class="text-lg text-gray-400">{{ $t('conversations.select_conversation_description') }}</div>
			<Button class="text-lg font-semibold mt-4" @click="showStartConversationDialog = true">
				{{ $t('conversations.initiate_conversation') }}
			</Button>
		</div>

		<div v-else class="col-span-4 flex flex-col max-h-[100vh]">
			<ChatHeader
				:conversation="selectedConversation"
				:changingSolved="changingSolved"
				:changingOwner="changingOwner"
				:stats="stats"
				@onSolved="conversationStore.changeSolved(selectedConversation, $event)"
				@onChangeOwner="conversationStore.changeOwner(selectedConversation, $event)"
				@onSearch="searchingContact = true"
			/>

			<div class="grid grid-cols-4 h-full overflow-hidden">
				<Chat
					ref="chatRef"
					class="col-span-3"
					:conversationId="selectedConversation.id"
					:contactName="getContactName(selectedConversation.contact) || ''"
					:messages="messages"
					:activities="activities"
					:assignedUser="selectedConversation.assigned_user"
					:loadingTop="messagesStore.messagesPaginationByConversation[selectedConversation.id]?.loading"
					:loadingBottom="sendingMessage"
					:disableReply="disableReply"
					:customEvent="!selectedConversation.is_initiated ? $t('new_broadcast.select_template') : undefined"
					:templates="messagesStore.templates"
					:users="userStore.users"
					:allMessagesLoaded="!messagesStore.messagesPaginationByConversation[selectedConversation.id]?.loading &&
						messagesStore.messagesPaginationByConversation[selectedConversation.id]?.meta.current_page ===
						messagesStore.messagesPaginationByConversation[selectedConversation.id]?.meta.last_page"
					@onSendMessage="sendTextMessage"
					@onCustomEvent="showTemplateDialog = true"
					@scrollTopReached="loadMoreMessages"
				/>

				<div class="bg-white border-l-2 border-slate-100 h-full overflow-hidden">
					<ContactPanel
						v-model:isSearching="searchingContact"
						:contact="selectedConversation.contact"
						:conversationId="selectedConversation.id"
						@onContactUpdated="updateContact"
						@scrollToMessage="handleScrollToMessage"
					/>
				</div>
			</div>
		</div>

		<StartConversationDialog
			v-model:visible="showStartConversationDialog"
			@onStartConversation="startConversation"
		/>

		<SelectTemplateDialog
			v-if="showTemplateDialog && selectedConversation"
			v-model:visible="showTemplateDialog"
			:conversationId="selectedConversation.id"
			@onConfirm="(message) => { showTemplateDialog = false; sendMessage(message) }"
		/>
	</div>
</template>
