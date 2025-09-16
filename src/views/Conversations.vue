<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useSessionStore, useUserStore } from '~/stores'
import { useConversationStore } from '~/stores/conversations'
import type { 
	TemplateItem,  ConversationItem, ConversationStatus, 
	CreateMessage, MessageItem, UserItem,
	ContactItem
} from '~/types'

const sessionStore = useSessionStore()
const conversationTab = ref<ConversationStatus>('mine')
const searchType = ref<'contact' | 'message'>('contact')
const templates = ref<TemplateItem[]>([])

const {
    dataPage: conversations,
    loading: loadingConversations,
    rowsPerPage: conversationsPerPage,
	searchTerm,
    fetchDataPage: fetchConversations,
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
const {
    dataPage: messages,
    rowsPerPage: messagesPerPage,
    fetchDataPage: fetchMessages,
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
const { fetchStats } = useConversationStore()
const handleError = useErrorHandler()
const { getContactPhone } = useContactUtils()

const selectedConversation = ref<ConversationItem>()
const showStartConversationDialog = ref(false)
const showTemplateDialog = ref(false)
const sendingMessage = ref(false)
const changingSolved = ref(false)
const changingOwner = ref(false)

const disableReply = computed(() => 
	selectedConversation.value?.is_solved || 
	selectedConversation.value?.is_expired || 
	!selectedConversation.value?.is_initiated
)

const startConversation = (conversation: ConversationItem) => {
	showStartConversationDialog.value = false
	selectedConversation.value = conversation
	fetchConversations(1, conversationsPerPage.value)
}

const tabChanged = (tab: ConversationStatus) => {
	conversationTab.value = tab
	fetchConversations(1, conversationsPerPage.value)
	fetchStats(conversationTab.value)
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

		fetchConversations(1, conversationsPerPage.value)
		fetchStats(conversationTab.value)
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
		const { data: response } = await API.conversation.changeSolved(selectedConversation.value?.id, solved)
		selectedConversation.value = {
			...selectedConversation.value,
			...response.data
		}

		fetchConversations(1, conversationsPerPage.value)
		fetchStats(conversationTab.value)
	} finally {
		changingSolved.value = false
	}
}

const sendTextMessage = async ({ message, type }: { message: string, type: 'REPLY' | 'NOTES'}) => {
	if(!selectedConversation.value) return

	const newMessage: CreateMessage = {
		conversation_id: selectedConversation.value.id,
		type: type === 'REPLY' ? 'text' : 'note',
		to_phone: '',
		content: message
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
	} catch(error) {
		handleError(error)
	} finally {
		sendingMessage.value = false
	}

	// TODO: Update new messages and messages states through socket updates
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
	const index = conversations.value.data.findIndex(c => c.id === conversationId)
	if (index >= 0) {
		const first = conversations.value.data[0]
		conversations.value.data[0] = conversations.value.data[index]
		conversations.value.data[index] = first

		selectedConversation.value = conversations.value.data[0]
		return
	}

	try {
		const { data: response } = await API.conversation.get(conversationId)
		conversations.value.data.unshift(response.data)
		selectedConversation.value = conversations.value.data[0]
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
		
		conversations.value.data = conversations.value.data.map(conv =>
			conv.id === selectedConversation.value?.id
				? { ...conv, contact }
				: conv
		)
	}
}

watch(selectedConversation, () => {
	if (selectedConversation.value) {
		fetchMessages(1, messagesPerPage.value)
	} else {
		messages.value.data = []
	}
})
watch(() => selectedConversation.value?.assigned_user, () => {
	if(selectedConversation.value && !selectedConversation.value?.assigned_user) {
		selectedConversation.value.assigned_user = { ...userStore.notAssigned }
	}
})

watch(searchTerm, () => debouncedFetch())
watch(searchType, () => debouncedFetch())

userStore.fetchUsers()
fetchStats(conversationTab.value)
fetchConversations(1, conversationsPerPage.value)
</script>

<template>
	<div class="grid grid-cols-5 h-full">
		<ConversationsPanel
			v-model:selectedConversation="selectedConversation"
			v-model:searchType="searchType"
			v-model:search="searchTerm"
			:conversations="conversations.data"
			:loading="loadingConversations"
			:initialTab="conversationTab"
			@onStartConversation="startConversation"
			@onTabChanged="tabChanged"
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
				@onSolved="changeSolved($event)"
				@onChangeOwner="changeOwner($event)"
			/>
			
			<div class="grid grid-cols-4 h-full">
				<Chat
					v-if="selectedConversation"
					class="col-span-3"
					:messages="messages.data"
					:assignedUser="selectedConversation.assigned_user"
					:loading="sendingMessage"
					:disableReply="disableReply"
					:disableReplyButton="selectedConversation.is_solved || selectedConversation.is_expired"
					:customEvent="!selectedConversation.is_initiated ? $t('new_broadcast.select_template') : undefined"
					:templates="templates"
					:users="userStore.users"
					@onSendMessage="sendTextMessage"
					@onCustomEvent="showTemplateDialog = true"
				/>

				<div class="bg-white border-l-2 border-slate-100">
					<ContactPanel
						:contact="selectedConversation.contact"
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