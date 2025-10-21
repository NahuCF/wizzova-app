<script setup lang="ts">
import { IconEdit, IconSearch, IconTrash, IconCircleOff, IconCircleCheck } from '@tabler/icons-vue'
import { useToast, type DataTablePageEvent } from 'primevue'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useRelativeDateLabel } from '~/composables/useRelativeDateLabel'
import { useSeverityMapper } from '~/composables/useSeverityMapper'
import router from '~/router'
import { API } from '~/services'
import type { BotStatus, Column } from '~/types'
import type { BotVersionItem, PageWithBotVersion } from '~/types'

const props = defineProps<{
	botId?: string
}>()

const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    fetchDataPage,
    debouncedFetch,
} = usePaginatedData<BotVersionItem, PageWithBotVersion<BotVersionItem>>(
    async (page, rows_per_page, search) => {
		if (props.botId) {
			const { data: response } = await API.botVersion.index(
				props.botId,
				{ page, rows_per_page, search }
			)

			return response
		}

		return {}
	},
    15
)

const { t } = useI18n()
const toast = useToast()
const { botSeverity } = useSeverityMapper()
const formatDate = useRelativeDateLabel()
const handleError = useErrorHandler()

const columns = ref<Column[]>([
	{ header: t('bots.headers.name'), key: 'nameField', type: 'CUSTOM' },
	{ header: t('bots.headers.sessions'), key: 'sessions', tooltip: t('bots.sessions_tooltip') },
	{ header: t('bots.headers.completed'), key: 'completed', type: 'PROGRESS', tooltip: t('bots.completed_tooltip') },
	{ header: t('bots.headers.abandoned'), key: 'abandoned', type: 'PROGRESS', tooltip: t('bots.abandoned_tooltip') },
	{ header: t('bots.headers.status'), key: 'statusTag', type: 'TAG' },
	{ header: '', key: 'actions', type: 'ACTIONS' }
])
const selectedVersionId = ref('')
const loadingUpdate = ref(false)
const showActivateWarning = ref(false)
const showDeactivateWarning = ref(false)
const showDeleteWarning = ref(false)

const selectedVersion = computed(() => {
	return dataPage.value.data?.find(version => version.id === selectedVersionId.value)
})

const transformedData = computed(() =>
	dataPage.value.data?.map(bot => {
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
			actions: versionActions
		}
	}) || []
)

const versionActions = (version: BotVersionItem) => {
	const actions = [
		{
			label: t('bot_details.actions.edit'),
			icon: IconEdit,
			action: () => {
				router.push({ 
					name: 'edit-botflow',
					params: {
						id: props.botId,
						versionId: version.id
					}
				})
			}
		}
	]
	
	if (version.status === 'draft') {
		actions.push({
			label: t('bot_details.actions.activate'),
			icon: IconCircleCheck,
			action: () => {
				selectedVersionId.value = version.id
				showActivateWarning.value = true
			}
		})
	}
	else {
		actions.push({
			label: t('bot_details.actions.deactivate'),
			icon: IconCircleOff,
			action: () => {
				selectedVersionId.value = version.id
				showDeactivateWarning.value = true
			}
		})
	}

	actions.push(
		{
			label: t('bot_details.actions.delete'),
			icon: IconTrash,
			action: () => {
				selectedVersionId.value = version.id
				showDeleteWarning.value = true
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

const onRowSelect = ({ data }: { data: BotVersionItem }) => {
    router.push({ 
		name: 'edit-botflow',
		params: {
			id: props.botId,
			versionId: data.id
		}
	})
}

const onChangeStatus = async (status: BotStatus) => {
	if(!props.botId) return

	loadingUpdate.value = true
	try {
		const { data: response } = await API.botVersion.changeStatus(props.botId, selectedVersionId.value, status)
		
		dataPage.value.data = dataPage.value.data.map(version => {
			if(version.id === selectedVersionId.value) {
				return {
					...version,
					...response.data
				}
			}

			return version
		})

		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: status === 'active' ? t('bot_details.version_activated') : t('bot_details.version_deactivated'),
			life: 3000,
		})

		if(status === 'active' && dataPage.value?.meta) {
			dataPage.value.meta.has_active_version = true
		}
		else if(status === 'draft' && dataPage.value?.meta) {
			dataPage.value.meta.has_active_version = false
		}
	} catch(error) {
		handleError(error)
	} finally {
		showActivateWarning.value = false
		showDeactivateWarning.value = false
		loadingUpdate.value = false
	}
}

const onDelete = async () => {
	if(!props.botId) return

	loadingUpdate.value = true
	try {
		const { data: response } = await API.botVersion.delete(props.botId, selectedVersionId.value)
		
		dataPage.value.data = dataPage.value.data.filter(version => version.id !== selectedVersionId.value)

		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: t('bot_details.version_deleted'),
			life: 3000,
		})
	} catch(error) {
		handleError(error)
	} finally {
		showDeleteWarning.value = false
		loadingUpdate.value = false
	}
}

watch(rowsPerPage, () => fetchDataPage())
watch(() => props.botId, () => fetchDataPage(), { immediate: true })
</script>

<template>
	<div class="flex flex-col gap-8 px-6 pb-6">
		<div class="flex gap-3">
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
			<Message 
				v-if="!dataPage.meta?.has_active_version"
				severity="warn"
			>
				{{ $t('bot_details.no_active_version') }}
			</Message>
        </div>

		<Table 
            :data="transformedData"
            :columns="columns"
            :hoverable="true"
            emptyMessage="bot_details.empty_versions"
            :loading="loading"
            v-model:rowsPerPage="rowsPerPage"
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
		</Table>

		<WarningDialog
			v-model:visible="showActivateWarning"
			:loading="loadingUpdate"
			:title="$t('bot_details.activate_version')"
			:message="$t('bot_details.activate_version_message')"
			:confirmMessage="$t('confirm')"
			@onConfirm="onChangeStatus('active')" 
		/>

		<WarningDialog
			v-model:visible="showDeactivateWarning"
			:loading="loadingUpdate"
			:title="$t('bot_details.deactivate_version')"
			:message="$t('bot_details.deactivate_version_message')"
			:confirmMessage="$t('confirm')"
			@onConfirm="onChangeStatus('draft')" 
		/>

		<WarningDialog
			v-model:visible="showDeleteWarning"
			:loading="loadingUpdate"
			:title="$t('bot_details.delete_version')"
			:message="selectedVersion?.status === 'active' 
				? $t('bot_details.delete_active_version_message') 
				: $t('bot_details.delete_version_message')"
			@onConfirm="onDelete" 
		/>
	</div>
</template>