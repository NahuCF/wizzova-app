<script setup lang="ts">
import { IconInfoCircle, IconSearch, IconCircleMinus, IconReload, IconLoader2 } from '@tabler/icons-vue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
			pinned: sessionStore.user && { user_id: sessionStore.user?.id, only_pinned: true },
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
const { t } = useI18n()
const userStore = useUserStore()
const { fetchStats } = useConversationStore()
const handleError = useErrorHandler()
const { getContactName, getContactPhone } = useContactUtils()

const selectedConversation = ref<ConversationItem>()
const showStartConversationDialog = ref(false)
const showTemplateDialog = ref(false)
const sendingMessage = ref(false)
const changingSolved = ref(false)
const changingOwner = ref(false)
const notAssigned: UserItem = {
	id: 'not_assigned',
	email: '',
	name: t('conversations.not_assigned'),
	cellphone_number: '',
	cellphone_prefix: '',
	cellphone: '',
	role: {
		id: 0,
		name: '',
		is_internal: false
	},
	wabas: [],
	permission_names: [],
	is_deleted: false,
	status: 'SIGNED_UP'
}

const users = computed(() => [
	notAssigned,
	...userStore.users
])

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
}

const changeOwner = async ({ value }: { value: string }) => {
	const newOwner = users.value.find(u => u.id === value)

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
		const { data: response } = await API.conversation.changeSolved(selectedConversation.value?.id, solved)
		selectedConversation.value = {
			...selectedConversation.value,
			...response.data
		}

		fetchConversations(1, conversationsPerPage.value)
		fetchStats()
	} finally {
		changingSolved.value = false
	}
}

const sendTextMessage = async ({ message, type }: { message: string, type: 'REPLY' | 'NOTES'}) => {
	if(!selectedConversation.value) return

	const newMessage: CreateMessage = {
		conversation_id: selectedConversation.value.id,
		type: 'text',
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
		selectedConversation.value.assigned_user = notAssigned
	}
})

watch(searchTerm, () => debouncedFetch())
watch(searchType, () => debouncedFetch())

userStore.fetchUsers()
fetchStats()
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

		<div v-if="selectedConversation" class="col-span-3 flex flex-col max-h-[100vh]">
			<div class="flex justify-between p-4 bg-white shadow">
				<div class="flex flex-col gap-2">
					<div class="flex gap-2">
						<h2 class="text-base">
							{{ getContactName(selectedConversation.contact) }}
						</h2>
						<div v-tooltip.bottom="{
							value: getContactPhone(selectedConversation.contact),
							class: 'max-w-[250px]!'
						}">
							<IconInfoCircle class="text-gray-400 hover:cursor-pointer" size="16" />
						</div>
					</div>

					<div
						v-tooltip.top="{
							value: selectedConversation.phone_number.display_phone_number,
							class: 'text-base max-w-[300px]!'
						}"
					>
						{{ selectedConversation.phone_number.verified_name }}
					</div>
				</div>

				<div v-if="selectedConversation.is_initiated" class="flex items-center gap-2">
					<div v-if="!selectedConversation.is_solved && !selectedConversation.is_expired">
						<Button
							severity="secondary"
							:disabled="changingSolved"
							@click="changeSolved(true)"
						>
							<IconLoader2 v-if="changingSolved" class="animate-spin w-6 h-6" />
							<div v-else class="flex items-center gap-2">
								<IconCircleMinus size="16" />
								<div>{{ $t('conversations.close') }}</div>
							</div>
						</Button>
					</div>
					<div v-if="selectedConversation.is_solved && !selectedConversation.is_expired">
						<Button
							severity="secondary"
							:disabled="changingSolved"
							@click="changeSolved(false)"
						>
							<IconLoader2 v-if="changingSolved" class="animate-spin w-6 h-6" />
							<div v-else class="flex items-center gap-2">
								<IconReload size="16" />
								<div>{{ $t('conversations.reopen') }}</div>
							</div>
						</Button>
					</div>

					<div>
						<Select
							:modelValue="selectedConversation.assigned_user?.id"
							@change="changeOwner"
							:options="users"
							optionValue="id"
							optionLabel="name"
							:placeholder="$t('conversations.assign_to')"
							:disabled="selectedConversation.is_solved || changingOwner"
							:loading="changingOwner"
							class="w-full min-w-[200px]" 
						/>
					</div>

					<Button
						severity="secondary"
						variant="text"
						class="min-w-[32px]! h-[32px]!"
						@click="() => {}"
					>
						<div>
							<IconSearch size="18" />
						</div>
					</Button>
				</div>
			</div>
			<Chat 
				v-if="selectedConversation"
				:messages="messages.data"
				:assignedUser="selectedConversation.assigned_user"
				:loading="sendingMessage"
				:disableReply="disableReply"
				:disableReplyButton="selectedConversation.is_solved || selectedConversation.is_expired"
				:customEvent="!selectedConversation.is_initiated ? $t('new_broadcast.select_template') : undefined"
				:templates="templates"
				@onSendMessage="sendTextMessage"
				@onCustomEvent="showTemplateDialog = true"
			/>
		</div>

		<div v-if="selectedConversation" class="bg-white border-l-2 border-slate-100">
			<ContactPanel
				:contact="selectedConversation.contact"
				@onContactUpdated="updateContact"
			/>
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