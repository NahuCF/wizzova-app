<script setup lang="ts">
import { IconPlus, IconSearch, IconFilter, IconX, IconStack, 
	IconUserPlus, IconPin, IconMessageDots, IconMessageCheck, IconLoader2 } from '@tabler/icons-vue'
import moment from 'moment'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContactUtils } from '~/composables/useContactUtils'
import { useConversationStore } from '~/stores/conversations'
import type { ConversationExists, ConversationFilters, ConversationItem, ConversationStatus } from '~/types'

const props = defineProps<{
	initialTab?: ConversationStatus,
	conversations: ConversationItem[],
	selectedConversation?: ConversationItem,
	search: string,
	searchType: 'contact' | 'message',
	loading?: boolean
}>()

const emit = defineEmits<{
	(e: 'onTabChanged', value: ConversationStatus): void,
	(e: 'update:selectedConversation', value?: ConversationItem): void,
	(e: 'update:search', value?: string): void,
	(e: 'update:searchType', value?: 'contact' | 'message'): void,
	(e: 'onStartConversation', conversation: ConversationItem): void,
	(e: 'navigateToConversation', conversationId: string): void
}>()

const { t } = useI18n()
const toast = useToast()
const conversationStore = useConversationStore()
const { stats } = storeToRefs(conversationStore)
const { getContactName } = useContactUtils()

const searchWrapper = ref()
const focusSearch = ref(false)
const currentTab = ref<ConversationStatus>(props.initialTab ?? 'unassigned')
const filtersPopover = ref()
const filters = ref<ConversationFilters>()
const showStartConversationDialog = ref(false)
const showNavigateToConversation = ref(false)
const searchTypes = ref([
	{
		id: 'contact',
		name: t('Contacts')
	},
	{
		id: 'message',
		name: t('Messages')
	}
])
const selectOpen = ref(false)
const conversationId = ref('')
const assignedUser = ref()

const tabs = computed(() => [
	{
		value: 'unassigned',
		stats: stats.value.unassigned,
		icon: IconStack
	},
	{
		value: 'mine',
		stats: stats.value.mine,
		icon: IconUserPlus
	},
	{
		value: 'pinned',
		stats: 0,
		icon: IconPin
	},
	{
		value: 'opened',
		stats: stats.value.opened,
		icon: IconMessageDots
	},
	{
		value: 'resolved',
		stats: stats.value.resolved,
		icon: IconMessageCheck
	}
])

const handleDocumentClick = (e: MouseEvent) => {
	const clickTarget = e.target as Node

	if (selectOpen.value) {
		return
	}

	if (!searchWrapper.value?.contains(clickTarget)) {
		focusSearch.value = false
	}
}


const selectConversation = (conversation: ConversationItem) => {
	emit('update:selectedConversation', conversation)

	if(conversation.unread_count > 0) {
		// TODO: Mark messages as read in backend
		conversation.unread_count = 0
	}
}

const startConversation = (conversation: ConversationItem) => {
	emit('onStartConversation', conversation)
	showStartConversationDialog.value = false
}

const onConversationExists = (conversationExists: ConversationExists) => {
	conversationId.value = conversationExists.data.conversation_id
	assignedUser.value = conversationExists.data.assigned_user_name

	if(!assignedUser.value) {
		showStartConversationDialog.value = false
		showNavigateToConversation.value = true
	}
	else {
		toast.add({
			severity: 'info',
			summary: 'Conversation exists',
			detail: `There is a conversation in progress already assigned to user ${assignedUser.value}`,
			life: 1000000,
		})
	}
}

const onConfirmNavigate = () => {
	emit('navigateToConversation', conversationId.value)
	showNavigateToConversation.value = false
}

const onApplyFilters = (newFilters: ConversationFilters) => {
	filters.value = { ...newFilters }

	if(!filters.value.status) {

	}
}

watch(currentTab, (newTab) => {
	emit('onTabChanged', newTab)
})

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
	<div class="flex flex-col bg-white h-full">
		<div class="flex gap-3 p-6">
			<div
				ref="searchWrapper"
				class="flex gap-2"
			>
				<Select
					v-if="focusSearch"
					:modelValue="searchType"
					@update:modelValue="emit('update:searchType', $event)"
					class="flex-1"
					:options="searchTypes" 
					:placeholder="$t('Select user')"
					optionLabel="name"
					optionValue="id"
					@show="selectOpen = true"
					@hide="selectOpen = false"
				/>
				<div class="relative w-full">
					<IconSearch 
						size="14" 
						class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
					/>
					<InputText
						:modelValue="props.search"
						@update:modelValue="emit('update:search', $event)"
						class="pl-8! pr-8! shadow-none!"
						name="search"
						id="search"
						fluid
						:placeholder="$t('search')"
						clear
						@focus="focusSearch = true"
					/>
					<IconX 
						v-if="props.search.length > 0"
						class="mr-2 absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
						size="14"
						@click.stop="emit('update:search', '')"
					/>
				</div>
			</div>
			<div v-show="!focusSearch">
				<Button @click="showStartConversationDialog = true">
					<div>
						<IconPlus size="16" />
					</div>
					<span>
						{{ $t(`New`) }}
					</span>
				</Button>
			</div>
			<div v-show="!focusSearch">
				<Button @click="(e: MouseEvent) => filtersPopover.show(e)" variant="text">
					<div>
						<IconFilter size="18" />
					</div>
				</Button>
			</div>
		</div>

		<div v-if="filters?.status" class="flex flex-col gap-1 px-6 pb-6">
			<div class="flex justify-between items-center">
				<div class="text-lg font-semibold">
					{{ filters.status === 'opened' ? $t('conversations.open_chats') : $t('conversations.resolved_chats') }}
				</div>
				<Button 
					variant="text"
					size="small"
					@click="filtersPopover.reset()" 
				>
					{{ $t('reset') }}
				</Button>
			</div>

			<div class="flex flex-wrap gap-2">
				<Tag severity="secondary" class="text-nowrap">
					{{ filters.status === 'opened' ? $t('conversations.open_chats') : $t('conversations.resolved_chats') }}
				</Tag>
				<Tag v-if="filters?.unread" severity="secondary" class="text-nowrap">
					{{ $t('conversations.unread_chats') }}
				</Tag>
				<Tag v-if="filters?.assignedUser" severity="secondary" class="text-nowrap">
					{{ filters.assignedUser.name }}
				</Tag>
			</div>
		</div>

		<div v-if="!focusSearch && !filters?.status">
			<Tabs v-model:value="currentTab" lazy>
				<TabList class="text-lg px-[3px]">
					<Tab v-for="tab in tabs" :value="tab.value" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t(`conversations.status.${tab.value}`),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<OverlayBadge 
								v-if="tab.stats > 0"
								:value="tab.stats"
								severity="danger"
								size="small"
							>
								<component :is="tab.icon" size="18" />
							</OverlayBadge>
							<component v-else :is="tab.icon" size="18" />
						</div>
					</Tab>
				</TabList>
			</Tabs>
		</div>

		<div v-if="!loading && conversations.length > 0" @click="emit('update:selectedConversation')" class="flex-1">
			<div 
				v-for="conversation in conversations" :key="conversation.id" 
				class="flex justify-between p-4 border-l-3 hover:bg-emerald-50 cursor-pointer overflow-hidden"
				:class="{
					'bg-emerald-50': selectedConversation?.id === conversation.id,
					'border-emerald-500': selectedConversation?.id === conversation.id,
					'border-transparent': selectedConversation?.id !== conversation.id
				}"
				@click.stop="() => {  selectConversation(conversation), focusSearch = false }"
			>
				<div class="flex items-center gap-3 flex-1 overflow-hidden">
					<div>
						<Avatar
							:label="getContactName(conversation.contact)?.charAt(0).toLocaleUpperCase()"
							size="large"
							shape="circle"
						/>
					</div>
					<div class="flex flex-col justify-between gap-1 min-w-0 flex-1">
						<div>{{ getContactName(conversation.contact) }}</div>
						<div class="text-gray-400 font-light truncate">
							{{ conversation.last_message?.content }}
						</div>
					</div>
				</div>
				<div class="flex flex-col justify-between items-end gap-2">
					<div class="text-sm text-gray-400">
						{{ conversation.last_message_at && moment(conversation.last_message_at).format('h:mm A') }}
					</div>
					<Badge
						v-if="conversation.unread_count > 0"
						rounded
						:value="conversation.unread_count"
						size="small"
					/>
				</div>
			</div>
		</div>
		<div v-else-if="!loading" class="flex justify-center p-8">
			<div class="text-gray-400">{{ $t('No conversations found') }}</div>
		</div>
		<div v-else class="flex justify-center p-8">
			<IconLoader2 class="animate-spin text-emerald-500" size="24" />
		</div>

		<ConversationFilters ref="filtersPopover" @onApply="onApplyFilters" />

		<StartConversationDialog
			v-model:visible="showStartConversationDialog"
			@onStartConversation="startConversation"
			@onConversationExists="onConversationExists"
		/>

		<WarningDialog 
			v-model:visible="showNavigateToConversation" 
			:title="$t('Conversation exists')"
			:message="$t('Do you want to navigate to the conversation with this contact?')"
			:cancelMessage="$t('no')"
			:confirm-message="$t('yes')"
			:loading="loading"
			@onCancel="showStartConversationDialog = true"
			@onConfirm="onConfirmNavigate"
		/>
	</div>
</template>

<style lang="css" scoped>
:deep(.p-tablist-tab-list){
	display: flex;
	justify-content: space-between;
	padding: 0 !important;
}
</style>