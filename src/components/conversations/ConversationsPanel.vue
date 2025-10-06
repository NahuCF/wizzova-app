<script setup lang="ts">
import { IconPlus, IconSearch, IconFilter, IconX, IconStack, 
	IconUserPlus, IconPin, IconMessageDots, IconMessageCheck, IconLoader2 } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { ConversationFilters as ConversationServiceFilters } from '~/services/ConversationService'
import { useConversationsStore } from '~/stores/conversations'
import type { ConversationExists, ConversationFilters, ConversationItem, ConversationStatus } from '~/types'

const emit = defineEmits<{
	(e: 'onStartConversation', conversation: ConversationItem): void,
	(e: 'navigateToConversation', conversationId: string): void
}>()

const { t } = useI18n()
const handleError = useErrorHandler()
const toast = useToast()
const conversationStore = useConversationsStore()
const { 
	selectedConversation,
	currentTab,
	stats: conversationStats
} = storeToRefs(conversationStore)

const {
	dataPage: filteredConversations,
	searchTerm: filteredSearchTerm,
	loading: loadingFiltered,
	loadNextPage: loadNextFilteredPage,
	fetchDataPage: fetchFilteredPage,
	debouncedFetch: debounceFiltered
} = usePaginatedData<ConversationItem>(
	async (page, rows_per_page, search) => {
		const transformedFilters: ConversationServiceFilters = {}

		if (filters.value?.status === 'opened') transformedFilters.only_opened = true
		if (filters.value?.status === 'resolved') transformedFilters.only_solved = true
		if (filters.value?.assignedUser) transformedFilters.user_id = filters.value.assignedUser.id
		if (search) transformedFilters.search_type = searchType.value

		const { data: response } = await API.conversation.index({
			page,
			rows_per_page,
			search,
			...transformedFilters
		})

		return response
	},
	20
)

const searchWrapper = ref()
const focusSearch = ref(false)
const filtersPopover = ref()
const filters = ref<ConversationFilters>()
const showStartConversationDialog = ref(false)
const showNavigateToConversation = ref(false)
const searchType = ref<'contact' | 'message'>('contact')
const searchTypes = ref([
	{ id: 'contact', name: t('conversations.contacts') },
	{ id: 'message', name: t('conversations.messages') }
])
const selectOpen = ref(false)
const conversationId = ref('')
const assignedUser = ref<string>()
const conversationScroll = ref()

const conversations = computed(() => conversationStore.conversationsByTab[currentTab.value] || [])
const loading = computed(() => conversationStore.loading)

const tabs = computed(() => [
	{ value: 'unassigned', stats: conversationStats.value.unassigned, icon: IconStack },
	{ value: 'mine', stats: conversationStats.value.mine, icon: IconUserPlus },
	{ value: 'mentioned', stats: conversationStats.value.mentioned, icon: IconPin },
	{ value: 'opened', stats: conversationStats.value.opened, icon: IconMessageDots },
	{ value: 'resolved', stats: conversationStats.value.resolved, icon: IconMessageCheck }
])

const noItems = computed(() => {
	if(filters.value || filteredSearchTerm.value || focusSearch.value) {
		return !loadingFiltered.value && filteredConversations.value.data.length === 0
	}
	else {
		const conversations = conversationStore.conversationsByTab[currentTab.value]
		return !conversationStore.loading && conversations.length === 0
	}
})

const handleDocumentClick = (e: MouseEvent) => {
	const clickTarget = e.target as Node
	if (selectOpen.value) return
	if (!searchWrapper.value?.contains(clickTarget)) focusSearch.value = false
}

const selectConversation = (conversation: ConversationItem) => {
	conversationStore.selectConversation(conversation)
	focusSearch.value = false
}

const startConversation = (conversation: ConversationItem) => {
	emit('onStartConversation', conversation)
	showStartConversationDialog.value = false
}

const onConversationExists = (conversationExists: ConversationExists) => {
	conversationId.value = conversationExists.data.conversation_id
	assignedUser.value = conversationExists.data.assigned_user_name

	console.log('assignedUser.value', assignedUser.value)
	if (conversationExists.message_code === 'exist_draft_conversation') {
		showStartConversationDialog.value = false
		showNavigateToConversation.value = true
	} 
	else if(conversationExists.message_code === 'exist_active_conversation') {
		toast.add({
			severity: 'info',
			summary: t('conversations.exists'),
			detail: t('conversations.conversation_assigned_to', { user: assignedUser.value }),
			life: 3000,
		})
	}
	else {
		handleError(conversationExists)
	}
}

const onConfirmNavigate = () => {
	emit('navigateToConversation', conversationId.value)
	showNavigateToConversation.value = false
}

const onApplyFilters = async (newFilters: ConversationFilters) => {
	const firstPage = filteredConversations.value.data.length === 0
	const filtersChanged = filters.value !== newFilters
	filters.value = { ...newFilters }

	if(firstPage || filtersChanged) {
		fetchFilteredPage()
	}
}

const resetFilters = () => {
	filtersPopover.value?.reset()
	filters.value = undefined
	filteredSearchTerm.value = ''
	filteredConversations.value.data = []

}

const onScroll = () => {
	const el = conversationScroll.value
	if (!el) return

	const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight
	if (!reachedBottom) return

	if (filters.value || filteredSearchTerm.value) {
		if (!loadingFiltered.value) loadNextFilteredPage()
	} else {
		if (!loading.value) conversationStore.loadNextPage()
	}
}

const handleTabChange = (value: string | number) => {
	const tab = value.toString()
	if (['unassigned', 'mine', 'mentioned', 'opened', 'resolved'].includes(tab)) {
		conversationStore.setTab(tab as ConversationStatus)
	}
}

watch(searchType, () => {
	debounceFiltered()
})

watch(filteredSearchTerm, () => {
	debounceFiltered()
})

watch(focusSearch, () => {
	filteredConversations.value.data = []
})

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))
</script>

<template>
<div class="flex flex-col bg-white h-full overflow-hidden">
	<div class="flex gap-3 p-6">
		<div ref="searchWrapper" class="flex gap-2 w-full">
			<Select
				v-if="focusSearch"
				v-model="searchType"
				class="flex-1"
				:options="searchTypes"
				:placeholder="$t('conversations.filters.select_user')"
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
					:modelValue="filteredSearchTerm"
					@update:modelValue="filteredSearchTerm = $event || ''"
					class="pl-8! pr-8! shadow-none!"
					name="search"
					id="search"
					fluid
					:placeholder="$t('search')"
					clear
					@focus="focusSearch = true"
				/>
				<IconX 
					v-if="filteredSearchTerm.length > 0"
					class="mr-2 absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
					size="14"
					@click.stop="filteredSearchTerm = ''"
				/>
			</div>
		</div>
		<div v-show="!focusSearch">
			<Button @click="showStartConversationDialog = true">
				<div><IconPlus size="16" /></div>
				<span>{{ $t('new') }}</span>
			</Button>
		</div>
		<div v-show="!focusSearch">
			<Button @click="(e: MouseEvent) => filtersPopover.show(e)" variant="text">
				<div><IconFilter size="18" /></div>
			</Button>
		</div>
	</div>

	<div v-if="filters?.status" class="flex flex-col gap-1 px-6 pb-6">
		<div class="flex justify-between items-center">
			<div class="text-lg font-semibold">
				{{ filters.status === 'opened' ? $t('conversations.filters.open_chats') : $t('conversations.filters.resolved_chats') }}
			</div>
			<Button variant="text" size="small" @click="resetFilters">
				{{ $t('reset') }}
			</Button>
		</div>
		<div class="flex flex-wrap gap-2">
			<Tag severity="secondary" class="text-nowrap">
				{{ filters.status === 'opened' ? $t('conversations.filters.open_chats') : $t('conversations.filters.resolved_chats') }}
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
		<Tabs :value="currentTab" @update:value="handleTabChange" lazy>
			<TabList class="text-lg px-[3px]">
				<Tab v-for="tab in tabs" :key="tab.value" :value="tab.value" class="flex-1">
					<div class="flex justify-center items-center text-inherit" v-tooltip.top="{
						value: $t(`conversations.status.${tab.value}`),
						class: 'text-base max-w-[300px]!'
					}">
						<OverlayBadge v-if="tab.stats > 0" :value="tab.stats" severity="danger" size="small">
							<component :is="tab.icon" size="18" />
						</OverlayBadge>
						<component v-else :is="tab.icon" size="18" />
					</div>
				</Tab>
			</TabList>
		</Tabs>
	</div>

	<div
		v-if="filters || filteredSearchTerm || focusSearch"
		ref="conversationScroll"
		class="overflow-y-auto max-h-full"
		@scrollend="onScroll"
	>
		<ConversationItem
			v-for="conversation in filteredConversations.data"
			:key="conversation.id"
			:conversation="conversation"
			:highlight="selectedConversation?.id === conversation.id"
			@onClick="selectConversation"
		/>
	</div>

	<!-- Show main tab conversations when no filter/search -->
	<div
		v-else
		ref="conversationScroll"
		class="overflow-y-auto max-h-full"
		@scrollend="onScroll"
	>
		<ConversationItem
			v-for="conversation in conversations"
			:key="conversation.id"
			:conversation="conversation"
			:highlight="selectedConversation?.id === conversation.id"
			@onClick="selectConversation"
		/>
	</div>

	<div v-if="noItems" class="flex justify-center p-8">
		<div class="text-center text-gray-400">{{ $t('conversations.no_conversations_found') }}</div>
	</div>
	<div v-if="loading || loadingFiltered" class="flex justify-center p-8">
		<IconLoader2 class="animate-spin text-emerald-500" size="24" />
	</div>

	<ConversationFilters
		ref="filtersPopover"
		@onApply="onApplyFilters"
	/>
	
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
:deep(.p-tablist-tab-list) {
	display: flex;
	justify-content: space-between;
	padding: 0 !important;
}
</style>
