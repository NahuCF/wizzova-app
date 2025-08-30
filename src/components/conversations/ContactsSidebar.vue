<script setup lang="ts">
import { IconPlus, IconSearch, IconFilter, IconX, IconStack, 
	IconUserPlus, IconPin, IconMessageDots, IconMessageCheck, IconLoader2 } from '@tabler/icons-vue'
import moment from 'moment'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import { useContactUtils } from '~/composables/useContactUtils';
import type { ConversationItem, ConversationStatus } from '~/types'

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
	(e: 'onStartConversation', conversation: ConversationItem): void
}>()

const { t } = useI18n()
const { getContactName } = useContactUtils()

const searchWrapper = ref()
const focusSearch = ref(false)
const currentTab = ref<ConversationStatus>(props.initialTab ?? 'UNASSIGNED')
const filtersPopover = ref()
const showStartConversationDialog = ref(false)
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

		<div v-if="!focusSearch">
			<Tabs v-model:value="currentTab" lazy>
				<TabList class="text-lg px-[3px]">
					<Tab value="UNASSIGNED" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t('conversations.status.UNASSIGNED'),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<IconStack size="18" />
						</div>
					</Tab>
					<Tab value="MINE" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t('conversations.status.MINE'),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<IconUserPlus size="18" />
						</div>
					</Tab>
					<Tab value="PINNED" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t('conversations.status.PINNED'),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<IconPin size="18" />
						</div>
					</Tab>
					<Tab value="OPENED" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t('conversations.status.OPENED'),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<IconMessageDots size="18" />
						</div>
					</Tab>
					<Tab value="SOLVED" class="flex-1">
						<div 
							class="flex justify-center items-center text-inherit"
							v-tooltip.top="{
								value: $t('conversations.status.RESOLVED'),
								class: 'text-base max-w-[300px]!'
							}"
						>
							<IconMessageCheck size="18" />
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
					<div class="text-sm text-gray-400">{{ moment(conversation.last_message_at).format('h:mm A') }}</div>
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

		<ConversationFilters ref="filtersPopover" />

		<StartConversationDialog
			v-model:visible="showStartConversationDialog"
			@onStartConversation="startConversation"
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