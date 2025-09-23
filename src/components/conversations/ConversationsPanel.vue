<script setup lang="ts">
import { IconPlus, IconSearch, IconFilter, IconX, IconStack, 
	IconUserPlus, IconPin, IconMessageDots, IconMessageCheck, IconLoader2 } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConversationStore } from '~/stores/conversations'
import type { ConversationExists, ConversationFilters, ConversationItem } from '~/types'

const emit = defineEmits<{
	(e: 'onStartConversation', conversation: ConversationItem): void,
	(e: 'navigateToConversation', conversationId: string): void
}>()

const { t } = useI18n()
const toast = useToast()
const conversationStore = useConversationStore()
const { 
	selectedConversation,
	searchType,
	conversationTab
} = storeToRefs(conversationStore)
const { stats } = storeToRefs(conversationStore)

const searchWrapper = ref()
const focusSearch = ref(false)
const filtersPopover = ref()
const filters = ref<ConversationFilters>()
const showStartConversationDialog = ref(false)
const showNavigateToConversation = ref(false)
const searchTypes = ref([
	{
		id: 'contact',
		name: t('conversations.contacts')
	},
	{
		id: 'message',
		name: t('conversations.messages')
	}
])
const selectOpen = ref(false)
const conversationId = ref('')
const assignedUser = ref()
const conversationScroll = ref()

const conversations = computed(() => conversationStore.pagination.dataPage.data)
const loading = computed(() => conversationStore.pagination.loading)

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
		value: 'mentioned',
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
	selectedConversation.value = conversation

	if(conversation.unread_count > 0) {
		// TODO: Mark messages as read in backend
		conversation.unread_count = 0
	}

	focusSearch.value = false
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
			summary: t('conversations.exists'),
			detail: t('conversations.conversation_assigned_to', { user:  assignedUser.value }),
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

const onScroll = () => {
	const el = conversationScroll.value
	if (!el) return

	const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight

	if (reachedBottom && !loading.value) {
		conversationStore.pagination.loadNextPage()
	}
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
	<div class="flex flex-col bg-white h-full overflow-hidden">
		<div class="flex gap-3 p-6">
			<div
				ref="searchWrapper"
				class="flex gap-2"
			>
				<Select
					v-if="focusSearch"
					:modelValue="searchType"
					@update:modelValue="searchType = $event"
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
						:modelValue="conversationStore.pagination.searchTerm"
						@update:modelValue="conversationStore.pagination.searchTerm = $event || ''"
						class="pl-8! pr-8! shadow-none!"
						name="search"
						id="search"
						fluid
						:placeholder="$t('search')"
						clear
						@focus="focusSearch = true"
					/>
					<IconX 
						v-if="conversationStore.pagination.searchTerm.length > 0"
						class="mr-2 absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
						size="14"
						@click.stop="conversationStore.pagination.searchTerm = ''"
					/>
				</div>
			</div>
			<div v-show="!focusSearch">
				<Button @click="showStartConversationDialog = true">
					<div>
						<IconPlus size="16" />
					</div>
					<span>
						{{ $t(`new`) }}
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
					{{ 
						filters.status === 'opened' 
							? $t('conversations.filters.open_chats') 
							: $t('conversations.filters.resolved_chats')
					}}
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
					{{ 
						filters.status === 'opened' 
							? $t('conversations.filters.open_chats') 
							: $t('conversations.filters.resolved_chats')
					}}
				</Tag>
				<Tag v-if="filters?.unread" severity="secondary" class="text-nowrap">
					{{ $t('conversations.filters.unread_chats') }}
				</Tag>
				<Tag v-if="filters?.assignedUser" severity="secondary" class="text-nowrap">
					{{ filters.assignedUser.name }}
				</Tag>
			</div>
		</div>

		<div v-if="!focusSearch && !filters?.status">
			<Tabs v-model:value="conversationTab" lazy>
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

		<div
			v-if="conversations.length > 0"
			ref="conversationScroll"
			class="overflow-y-auto max-h-full"
			@click="selectedConversation = undefined"
			@scrollend="onScroll"
		>
			<ConversationItem
				v-for="conversation in conversations"
				:key="conversation.id"
				:conversation="conversation"
				:highlight="selectedConversation?.id === conversation.id"
				@onClick="selectConversation($event)"
			/>
		</div>
		<div v-else-if="!loading" class="flex justify-center p-8">
			<div class="text-center text-gray-400">{{ $t('conversations.no_conversations_found') }}</div>
		</div>
		<div v-if="loading" class="flex justify-center p-8">
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
			:title="$t('conversations.exists')"
			:message="$t('conversations.navigate_to_conversation')"
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