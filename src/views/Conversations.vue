<script setup lang="ts">
import { IconInfoCircle, IconCheck, IconSearch } from '@tabler/icons-vue'
import { ref, watch } from 'vue'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useSessionStore, useUserStore } from '~/stores'
import type { ConversationItem, ConversationStatus, CreateMessage, MessageItem } from '~/types'

const sessionStore = useSessionStore()
const conversationTab = ref<ConversationStatus>('UNASSIGNED')
const searchType = ref<'contact' | 'message'>('contact')

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
			UNASSIGNED: { only_unassigned: true },
			MINE: sessionStore.user && { user_id: sessionStore.user?.id },
			PINNED: { only_pinned: true },
			OPENED: { only_opened: true },
			SOLVED: { only_solved: true }
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
    (page, rows_per_page) => {
		if(!selectedConversation.value) return new Promise(resolve => resolve([]))
		
		return API.message.index({
			page,
			rows_per_page,
			conversation_id: selectedConversation.value?.id
		}).then(res => res.data)
	},
    15
)
const userStore = useUserStore()
const handleError = useErrorHandler()
const { getContactName, getContactPhone } = useContactUtils()

const selectedConversation = ref<ConversationItem>()
const showStartConversationDialog = ref(false)
const sendingMessage = ref(false)

const startConversation = (conversation: ConversationItem) => {
	showStartConversationDialog.value = false
	selectedConversation.value = conversation
	fetchConversations(1, conversationsPerPage.value)
}

const tabChanged = (tab: ConversationStatus) => {
	conversationTab.value = tab
	fetchConversations(1, conversationsPerPage.value)
}

const setUser = ({ value }: { value: string }) => {
	if(!selectedConversation.value) return


	console.log('new user:', value)
	selectedConversation.value.assigned_user = userStore.users.find(u => u.id === value)
}

const sendMessage = async ({ message, type }: { message: string, type: 'REPLY' | 'NOTES'}) => {
	const contactPhone = selectedConversation.value && getContactPhone(selectedConversation.value.contact)

	if(!selectedConversation.value || !contactPhone) return

	sendingMessage.value = true
	try {
		const newMessage: CreateMessage = {
			conversation_id: selectedConversation.value.id,
			direction: 'outbound',
			type: 'text',
			status: 'pending',
			from_phone: '',
			to_phone: contactPhone,
			content: message
		}

		const { data: response } = await API.message.create(newMessage)

		messages.value.data.push(response.data)
	} catch(error) {
		handleError(error)
	} finally {
		sendingMessage.value = false
	}

	// TODO: Update new messages and messages states through socket updates
}

watch(selectedConversation, () => {
	if (selectedConversation.value) {
		fetchMessages(1, messagesPerPage.value)
	} else {
		messages.value.data = []
	}
})

watch(searchTerm, () => debouncedFetch())
watch(searchType, () => debouncedFetch())

userStore.fetchUsers()
fetchConversations(1, conversationsPerPage.value)
</script>

<template>
	<div class="grid grid-cols-5 h-full">
		<ContactsSidebar
			v-model:selectedConversation="selectedConversation"
			v-model:searchType="searchType"
			v-model:search="searchTerm"
			:conversations="conversations.data"
			:loading="loadingConversations"
			@onStartConversation="startConversation"
			@onTabChanged="tabChanged"
		/>

		<div v-if="!selectedConversation" class="col-span-4">
			<div class="flex flex-col gap-4 justify-center items-center h-full">
				<div class="text-[1.6rem] font-bold">
					{{ $t('Select Conversation') }}
				</div>
				<div class="text-lg text-gray-400">
					{{ $t('Select any conversation to view all the messages.') }}
				</div>
				<Button class="text-lg font-semibold mt-4" @click="showStartConversationDialog = true">
					{{ $t('Initiate new conversation') }}
				</Button>
			</div>
		</div>

		<div v-if="selectedConversation" class="col-span-3 flex flex-col max-h-[100vh]">
			<div class="flex justify-between p-4 bg-white shadow">
				<div class="flex items-center gap-2">
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

				<div class="flex gap-2">
					<Button
						class="w-full"
						severity="secondary"
						@click="() => {}"
					>
						<div class="flex items-center gap-2">
							<IconCheck size="16" />
							<div>{{ $t('conversations.resolve') }}</div>
						</div>
					</Button>
					<Select
						:modelValue="selectedConversation.assigned_user?.id"
						@change="setUser"
						:options="userStore.users"
						optionValue="id"
						optionLabel="name"
						:placeholder="$t('conversations.assign_to')"
						class="w-full min-w-[200px]" 
					/>
					<Button
						severity="secondary"
						variant="text"
						@click="() => {}"
					>
						<div class="px-6">
							<IconSearch size="20" />
						</div>
					</Button>
				</div>
			</div>
			<Chat 
				v-if="selectedConversation"
				:messages="messages.data"
				:assignedUser="selectedConversation.assigned_user"
				:loading="sendingMessage"
				@onSendMessage="sendMessage"
			/>
		</div>

		<div v-if="selectedConversation" class="bg-white">
		</div>

		<StartConversationDialog
			v-model:visible="showStartConversationDialog"
			@onStartConversation="startConversation"
		/>
	</div>
</template>