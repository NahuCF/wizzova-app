<script setup lang="ts">
import { IconCopy, IconEdit, IconSearch, IconPlus, IconGraph, IconVersions, IconTrash, IconLoader2 } from '@tabler/icons-vue'
import { useToast, type DataTablePageEvent } from 'primevue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useRelativeDateLabel } from '~/composables/useRelativeDateLabel'
import { useSeverityMapper } from '~/composables/useSeverityMapper'
import router from '~/router'
import { API } from '~/services'
import type { BotActiveSessions, Column } from '~/types'
import type { BotCreate, BotItem, BotTriggerTag } from '~/types'

const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    currentPageReport,
    fetchDataPage,
    debouncedFetch,
} = usePaginatedData<BotItem>(
    (page, rows_per_page, search) => API.bot.index({ page, rows_per_page, search: search || undefined }).then(res => res.data),
    10
)

const {
    loading: loadingDrawer,
    createOrUpdate,
	remove
} = useCrudActions<BotCreate>({
    api: {
        create: API.bot.create,
		delete: API.bot.delete
    },
    fetchData: () => {
        fetchDataPage(1, rowsPerPage.value)
    },
    i18nKeys: {
        created: 'bots.bot_created',
		deleted: 'bots.bot_deleted'
    }
})

const { t } = useI18n()
const toast = useToast()
const { botSeverity } = useSeverityMapper()
const formatDate = useRelativeDateLabel()
const handleError = useErrorHandler()

const showCreateDrawer = ref(false)
const showCloneWarning = ref(false)
const showDeleteWarning = ref(false)
const showActiveSessionsWarning = ref(false)
const loadingSessions = ref(false)
const activeSessions = ref<BotActiveSessions>({
	total_active_sessions: 0,
	has_active_sessions: false,
	waba_names: []
})
const columns = ref<Column[]>([
	{ header: t('bots.headers.name'), key: 'nameField', type: 'CUSTOM' },
	{ header: t('bots.headers.triggers'), key: 'triggers', type: 'CUSTOM' },
	{ header: t('bots.headers.sessions'), key: 'sessions', tooltip: t('bots.sessions_tooltip') },
	{ header: t('bots.headers.completed'), key: 'completed', type: 'PROGRESS', tooltip: t('bots.completed_tooltip') },
	{ header: t('bots.headers.abandoned'), key: 'abandoned', type: 'PROGRESS', tooltip: t('bots.abandoned_tooltip') },
	{ header: t('bots.headers.status'), key: 'statusTag', type: 'TAG' },
	{ header: '', key: 'actions', type: 'ACTIONS' }
])
const selectedBotId = ref('')

const transformedData = computed(() =>
	dataPage.value.data.map(bot => {
		const completedPercentage = bot.completed_sessions > 0
			? Math.round((bot.completed_sessions / bot.total_sessions) * 100)
			: 0
		const abandonedPercentage = bot.abandoned_sessions > 0
			? Math.round((bot.abandoned_sessions / bot.total_sessions) * 100)
			: 0

		return {
			...bot,
			nameField: {
				name: bot.name,
				created: formatDate(bot.created_at, bot.created_by?.name),
				updated: formatDate(bot.updated_at, bot.updated_by?.name)
			},
			triggers: buildTriggerTags(bot),
			sessions: bot.total_sessions,
			completed: { 
				count: bot.completed_sessions, 
				percentage: completedPercentage, 
				color: 'stroke-emerald-500'
			},
			abandoned: { 
				count: bot.abandoned_sessions, 
				percentage: abandonedPercentage, 
				color: 'stroke-red-600'
			},
			statusTag: {
				label: bot.status ? t(`bots.status.${bot.status}`) : t('bots.status.draft'),
				severity: botSeverity(bot.status)
			},
			actions: botActions
		}
	})
)

const buildTriggerTags = (bot: BotItem): BotTriggerTag[] => {
	if (bot.trigger_type === 'any_message') return [{ label: t('bots.any_message'), color: 'info' }]
	if (!bot.keywords) return []

	const max = 3
	const tags: BotTriggerTag[] = bot.keywords.slice(0, max).map(k => ({ label: k.keyword }))
	if (bot.keywords.length > max) {
		tags.push({
			label: `+${bot.keywords.length - max}`,
			tooltip: bot.keywords.slice(max).map(k => k.keyword).join('\n')
		})
	}
	return tags
}

const botActions = (bot: BotItem) => {
	const actions = []
	
	actions.push(
		{
			label: t('bots.actions.edit'),
			icon: IconEdit,
			action: () => router.push({ 
				name: 'bot-details',
				params: { id: bot.id },
				query: {
					tab: 'settings'
				}
			})
		},
		{
			label: t('bots.actions.stats'),
			icon: IconGraph,
			action: () => router.push({ 
				name: 'bot-details',
				params: { id: bot.id },
				query: {
					tab: 'stats'
				}
			})
		},
		{
			label: t('bots.actions.versions'),
			icon: IconVersions,
			action: () => router.push({ 
				name: 'bot-details',
				params: { id: bot.id },
				query: {
					tab: 'versions'
				}
			})
		},
		{
			label: t('bots.actions.clone'),
			icon: IconCopy,
			action: () => {
				selectedBotId.value = bot.id
				showCloneWarning.value = true
			}
		},
		{
			label: t('delete'),
			class: 'text-red-600',
			icon: loadingSessions.value ? IconLoader2 : IconTrash,
			iconClass: loadingSessions.value ? 'animate-spin' : '',
			disabled: loadingSessions.value,
			action: async () => {
				loadingSessions.value = true
				try {
					const { data: response } = await API.bot.activeSessions(bot.id)
					
					if(response.waba_names.length === 0) {
						selectedBotId.value = bot.id
						showDeleteWarning.value = true
					}
					else {
						activeSessions.value = response
						showActiveSessionsWarning.value = true
					}
				} catch(error) {
					console.log(error)
				} finally {
					loadingSessions.value = false
				}
			}
		}
	)
	return [actions]
}

const onPage = (event: DataTablePageEvent) => {
	rowsPerPage.value = event.rows
	const page = Math.floor(event.first / event.rows) + 1
	fetchDataPage(page, rowsPerPage.value)
}

const onRowSelect = ({ data }: { data: BotItem }) => {
    router.push({ 
		name: 'bot-details', 
		params: { id: data.id }
	})
}

const onSave = (newBot: BotCreate) => {
    createOrUpdate(newBot, {
        onSuccess: () => showCreateDrawer.value = false
    })
}

const onDelete = () => {
    if (selectedBotId.value) {
        remove(selectedBotId.value, {
            onSuccess: () => showDeleteWarning.value = false
        })
    }
}

const onClone = async (name: string) => {
	try {
		await API.bot.clone(selectedBotId.value, name)
		fetchDataPage(1, rowsPerPage.value)

		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: t('bots.bot_cloned'),
			life: 3000,
		})
	} catch(error) {
		handleError(error)
	}

	showCloneWarning.value = false
}

watch(rowsPerPage, () => fetchDataPage(), { immediate: true })
</script>

<template>
	<div class="flex flex-col gap-8 p-6">
		<h1 class="font-semibold text-2xl">{{ $t('bots.title') }}</h1>

		<div class="flex justify-between">
            <div class="relative">
                <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <InputText
                    v-model="searchTerm"
                    class="pl-8! max-w-[180px] shadow-none!"
                    name="search"
                    id="search"
                    fluid
                    :placeholder="$t('search')"
                    @input="debouncedFetch()"
                />
            </div>
            <Button @click="showCreateDrawer = true">
                <IconPlus size="16" class="mr-1" />
                <span>
                    {{ $t('bots.create_bot') }}
                </span>
            </Button>
        </div>

		<Table 
            :data="transformedData"
            :columns="columns"
            :hoverable="true"
            emptyMessage="bots.empty"
            :loading="loading"
            withPagination
            :totalRecords="dataPage.meta.total"
            v-model:rowsPerPage="rowsPerPage"
            :currentPageReport="currentPageReport"
			@onRowClick="onRowSelect"
            @onPage="onPage"
        >
			<template #nameField="{ data }">
                <div class="flex">
                    <div class="flex flex-col">
						<span
							class="block whitespace-nowrap max-w-[250px] truncate"
						>
							{{ data.nameField.name }}
						</span>
						<span
							class="w-full text-nowrap max-w-[250px] truncate text-gray-400"
							v-tooltip.bottom="{
								value: `${
									$t('created_by', { author: data.nameField.created.tooltip.author }) + '\n' +
									$t('created_at', { date: data.nameField.created.tooltip.date }) +
									(
										data.nameField.updated.tooltip.author
											? '\n\n' +
												$t('updated_by', { author: data.nameField.updated.tooltip.author }) + '\n' +
												$t('updated_at', { date: data.nameField.updated.tooltip.date })
											: ''
									)
								}`,
								class: 'text-base max-w-full!'
							}"
						>
							{{ $t('bots.last_updated', { date: data.nameField.updated.label || data.nameField.created.label }) }}
						</span>
					</div>
                </div>
            </template>
			
			<template #triggers="{ data: { triggers } }: { data: { triggers: BotTriggerTag[] }}">
				<div class="flex items-center gap-3">
					<template v-for="trigger in triggers">
						<div
							v-if="trigger.tooltip"
							v-tooltip.bottom="trigger.tooltip"
						>
							<Badge
								severity="danger"
							>
								{{ trigger.label }}
							</Badge>
						</div>

						<div v-else>
							<Tag
								:value="trigger.label"
								:severity="trigger.color || 'secondary'"
								class="text-base! text-nowrap!"
							/>
						</div>
					</template>
				</div>
			</template>
		</Table>

		<CreateBotDrawer
			v-model:visible="showCreateDrawer"
			:title="$t('bots.create_bot')"
			:loading="loadingDrawer"
			@onSave="onSave"
		/>

		<CloneBotDialog
			v-model:visible="showCloneWarning"
			@onConfirm="onClone"
		/>

		<WarningDialog
			v-model:visible="showDeleteWarning"
			:title="$t('bots.delete_bot')"
			:message="$t('bots.delete_message')"
			@onConfirm="onDelete" 
		/>

		<WarningDialog 
			v-model:visible="showActiveSessionsWarning" 
			:title="$t('bots.active_sessions')"
			:message="$t('bots.active_sessions_list')"
			hideButtons
		>
			<template #note>
				<div class="flex flex-col gap-1 pb-4 px-6">
					<div 
						v-for="name in activeSessions.waba_names" 
						:key="name"
						class="text-surface-500 dark:text-surface-400 text-gray-600"
					>
						{{ name }}
					</div>
				</div>

				<div>
					{{ $t('bots.active_sessions_warning') }}
				</div>

				<div class="flex justify-center pt-8">
					<Button variant="text" @click="router.push({ name: 'conversations' })">
						<span>
							{{ $t('bots.go_to_chats') }}
						</span>
					</Button>
				</div>
			</template>
		</WarningDialog>
	</div>
</template>