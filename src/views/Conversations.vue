<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useConversationChannels } from '~/composables/pusher/useConversationChannels'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useUserStore } from '~/stores'
import { useConversationStore } from '~/stores/conversations'
import type { 
	TemplateItem,  ConversationItem, CreateMessage, 
	MessageItem, ContactItem, ConversationActivity
} from '~/types'

const conversationStore = useConversationStore()
const {
	selectedConversation,
	changingSolved,
	changingOwner,
} = storeToRefs(conversationStore)

const {
    dataPage: messages,
    rowsPerPage: messagesPerPage,
    fetchDataPage: fetchMessages,
	loadNextPage: loadMoreMessages
} = usePaginatedData<MessageItem>(
    async (page, rows_per_page) => {
		if(!selectedConversation.value) return new Promise(resolve => resolve([]))

		const { data: response } = await API.message.index({
			page,
			rows_per_page,
			conversation_id: selectedConversation.value?.id
		})

		response.data.forEach(message => {
			const isTemplate = message.type === 'template' && message.template_id
			if(isTemplate && !hasTemplate(message.template_id)) {
				addTemplate(message.template_id)
			}
		})
		
		return response
	},
    15
)

const userStore = useUserStore()
const handleError = useErrorHandler()
const { getContactName, getContactPhone } = useContactUtils()
useConversationChannels(messages)

const showStartConversationDialog = ref(false)
const showTemplateDialog = ref(false)
const sendingMessage = ref(false)
const activities = ref<ConversationActivity[]>([])
const templates = ref<TemplateItem[]>([])
const searchingContact = ref(false)

const conversations = computed({
	get: () => conversationStore.pagination.dataPage.data,
  	set: (val) => (conversationStore.pagination.dataPage.data = val)
})

const disableReply = computed(() => 
	selectedConversation.value?.is_solved || 
	selectedConversation.value?.is_expired || 
	!selectedConversation.value?.is_initiated
)

const startConversation = (conversation: ConversationItem) => {
	showStartConversationDialog.value = false
	selectedConversation.value = conversation
	conversationStore.pagination.fetchDataPage()
}

const sendTextMessage = async ({ message, type, mentions, replyId }: {
	message: string,
	type: 'REPLY' | 'NOTES',
	mentions: Record<string, string>[],
	replyId?: string
}) => {
	if(!selectedConversation.value) return

	const newMessage: CreateMessage = {
		conversation_id: selectedConversation.value.id,
		type: type === 'REPLY' ? 'text' : 'note',
		to_phone: '',
		content: message,
		mentions: mentions.length > 0 ? mentions : undefined,
	}

	if(replyId) {
		newMessage.reply_to_message_id = replyId
	}
	
	sendMessage(newMessage)
}

const sendMessage = async (newMessage: CreateMessage) => {
	const contactPhone = selectedConversation.value && getContactPhone(selectedConversation.value.contact)
	if(!contactPhone) return

	newMessage.to_phone = contactPhone
	sendingMessage.value = true
	try {
		const { data: response } = await API.message.create(newMessage)

		messages.value.data.push(response.data)

		if(response.data.template_id && !hasTemplate(response.data.template_id)) {
			addTemplate(response.data.template_id)
		}

		if(selectedConversation.value && !selectedConversation.value.is_initiated) {
			selectedConversation.value = {
				...selectedConversation.value,
				is_initiated: true
			}
			fetchActivities()
		}
	} catch(error) {
		handleError(error)
	} finally {
		sendingMessage.value = false
	}
}

const hasTemplate = (templateId: string) => {
	return !!templates.value.find(template => template.id === templateId)
}

const addTemplate = async (templateId: string) => {
	try {
		const { data: response } = await API.template.get(templateId)
		templates.value.push({
			...response.data,
			days_since_meta_update: 0,
			updated_count_while_approved: 0
		})
	} catch(error) {
		handleError(error)
	}
}

const navigateToConversation = async (conversationId: string) => {
	const index = conversations.value.findIndex(c => c.id === conversationId)
	if (index >= 0) {
		const first = conversations.value[0]
		conversations.value[0] = conversations.value[index]
		conversations.value[index] = first

		selectedConversation.value = conversations.value[0]
		return
	}

	try {
		const { data: response } = await API.conversation.get(conversationId)
		conversations.value.unshift(response.data)
		selectedConversation.value = conversations.value[0]
	} catch(error) {
		handleError(error)
	}
}

const updateContact = (contact: ContactItem) => {
	if(selectedConversation.value) {
		selectedConversation.value = {
			...selectedConversation.value,
			contact
		}
		
		conversations.value = conversations.value.map(conv =>
			conv.id === selectedConversation.value?.id
				? { ...conv, contact }
				: conv
		)
	}
}

const fetchActivities = async () => {
	if(!selectedConversation.value) return

	try {
		const { data: response } = await API.conversation.activities(selectedConversation.value.id)
		activities.value = response.data
	} catch(error) {
		handleError(error)
	}
}

watch(selectedConversation, () => {
	if (selectedConversation.value) {
		fetchMessages(1, messagesPerPage.value)
		fetchActivities()
	} else {
		messages.value.data = []
	}
})

userStore.fetchUsers()
conversationStore.fetchStats()
conversationStore.pagination.fetchDataPage()
</script>

<template>
	<div class="grid grid-cols-5 h-full">
		<ConversationsPanel
			@onStartConversation="startConversation"
			@navigateToConversation="navigateToConversation"
		/>

		<div v-if="!selectedConversation" class="col-span-4">
			<div class="flex flex-col gap-4 justify-center items-center h-full">
				<div class="text-[1.6rem] font-bold">
					{{ $t('conversations.select_conversation') }}
				</div>
				<div class="text-lg text-gray-400">
					{{ $t('conversations.select_conversation_description') }}
				</div>
				<Button class="text-lg font-semibold mt-4" @click="showStartConversationDialog = true">
					{{ $t('conversations.initiate_conversation') }}
				</Button>
			</div>
		</div>

		<div v-if="selectedConversation" class="col-span-4 flex flex-col max-h-[100vh]">
			<ChatHeader
				:conversation="selectedConversation"
				:changingSolved="changingSolved"
				:changingOwner="changingOwner"
				@onSolved="conversationStore.changeSolved($event)"
				@onChangeOwner="conversationStore.changeOwner($event)"
				@onSearch="searchingContact = true"
			/>
			
			<div class="grid grid-cols-4 h-full overflow-hidden">
				<Chat
					v-if="selectedConversation"
					class="col-span-3"
					:contactName="getContactName(selectedConversation.contact) || ''"
					:messages="messages.data"
					:activities="activities"
					:assignedUser="selectedConversation.assigned_user"
					:loading="sendingMessage"
					:disableReply="disableReply"
					:customEvent="!selectedConversation.is_initiated ? $t('new_broadcast.select_template') : undefined"
					:templates="templates"
					:users="userStore.users"
					@onSendMessage="sendTextMessage"
					@onCustomEvent="showTemplateDialog = true"
					@scrollBottomReached="loadMoreMessages"
				/>

				<div class="bg-white border-l-2 border-slate-100 h-full overflow-hidden">
					<ContactPanel
						v-model:isSearching="searchingContact"
						:contact="selectedConversation.contact"
						:conversationId="selectedConversation.id"
						@onContactUpdated="updateContact"
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
			@onConfirm="(message) => { showTemplateDialog = false, sendMessage(message) }"
		/>
	</div>
</template>