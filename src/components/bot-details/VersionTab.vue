<script setup lang="ts">
import { IconCopy, IconEdit, IconSend,IconSearch, IconPlus } from '@tabler/icons-vue'
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
import type { Column } from '~/types'
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
	const actions = []
	
	if (version.status === 'draft') {
		actions.push({
			label: t('bots.actions.publish'),
			icon: IconSend,
			action: () => {
				selectedVersionId.value = version.id
			}
		})
	}
	actions.push(
		{
			label: t('bots.actions.edit'),
			icon: IconEdit,
			action: () => router.push({ 
				name: 'bot-details',
				params: { id: version.id }
			})
		},
		{
			label: t('bots.actions.clone'),
			icon: IconCopy,
			action: () => {
				selectedVersionId.value = version.id
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
		name: 'new-botflow', 
		params: { id: data.id }
	})
}

watch(rowsPerPage, () => fetchDataPage(), { immediate: true })
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
	</div>
</template>