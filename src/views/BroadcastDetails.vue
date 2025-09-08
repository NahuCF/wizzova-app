<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft, IconRefresh, IconDownload, IconLoader2, 
	IconArrowBackUp, IconCheck, IconChecks, IconExclamationCircle, IconUsers, 
	IconClock, IconTrash, IconInfoCircle} from '@tabler/icons-vue'
import { computed, ref, type Component } from 'vue'
import type { BroadcastDetail, Column, MessageItem, MessageStatus } from '~/types'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import moment from 'moment'
import { useSeverityMapper } from '~/composables/useSeverityMapper'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const handleError = useErrorHandler()
const { broadcastSeverity } = useSeverityMapper()
const {
    dataPage,
    loading: loadingMessages,
    rowsPerPage,
    currentPageReport,
    fetchDataPage,
    onPage
} = usePaginatedData<MessageItem>(
    (page, perPage) => {
		const broadcastId = route.params.id
        if(typeof broadcastId !== 'string') return new Promise(resolve => resolve({ data: [], meta: {} }))

        return API.message.index({
			page,
            rows_per_page: perPage,
            broadcast_id: broadcastId
        }).then(res => res.data)
    },
    10
)

const broadcast = ref<BroadcastDetail>()
const loading = ref(false)
const canRefresh = ref(true)
const columns: Column[] = [
    { header: t('broadcast_details.headers.name'), key: 'name', type: 'CUSTOM' },
	{ header: t('broadcast_details.headers.phone'), key: 'from_phone' },
    { header: t('broadcast_details.headers.status'), key: 'status', type: 'CUSTOM' },
]

const statusIcon: Record<MessageStatus, { icon: Component, class: string }> = {
	pending: {
		icon: IconClock,
		class: 'text-gray-500'
	},
	sent: {
		icon: IconCheck,
		class: 'text-gray-500'
	},
	delivered: {
		icon: IconChecks,
		class: 'text-neutral-900'
	},
	read: {
		icon: IconChecks,
		class: 'text-sky-600'
	},
	failed: {
		icon: IconExclamationCircle,
		class: 'text-red-600'
	},
	deleted: {
		icon: IconTrash,
		class: 'text-red-600'
	},
}

const overviewCards = computed(() => {
	const recipients = broadcast.value?.recipients_count ?? 0
	const sent = broadcast.value?.sent_count ?? 0
	const delivered = broadcast.value?.delivered_count ?? 0
	const readed = broadcast.value?.readed_count ?? 0
	const replied = broadcast.value?.replied_count ?? 0
	const failed = broadcast.value?.failed_count ?? 0

	return [
		{
			key: 'recipients',
			label: t('broadcasts.headers.recipients'),
			icon: IconUsers,
			colorClass: '',
			count: recipients
		},
		{
			key: 'sent',
			label: t('broadcasts.headers.sent'),
			icon: IconCheck,
			colorClass: 'text-gray-500',
			count: sent,
			percentage: recipients > 0 ? Math.round((sent / recipients) * 100) : 0
		},
		{
			key: 'received',
			label: t('broadcasts.headers.delivered'),
			icon: IconChecks,
			colorClass: 'text-neutral-900',
			count: delivered,
			percentage: recipients > 0 ? Math.round((delivered / recipients) * 100) : 0
		},
		{
			key: 'read',
			label: t('broadcasts.headers.readed'),
			icon: IconChecks,
			colorClass: 'text-sky-600',
			count: readed,
			percentage: recipients > 0 ? Math.round((readed / recipients) * 100) : 0
		},
		{
			key: 'replied',
			label: t('broadcasts.headers.replied'),
			icon: IconArrowBackUp,
			colorClass: 'text-emerald-500',
			count: replied,
			percentage: recipients > 0 ? Math.round((replied / recipients) * 100) : 0
		},
		{
			key: 'failed',
			label: t('broadcasts.headers.failed'),
			icon: IconExclamationCircle,
			colorClass: 'text-red-600',
			count: failed,
			percentage: recipients > 0 ? Math.round((failed / recipients) * 100) : 0
		}
	]
})

const transformedData = computed(() => {
	return dataPage.value.data.map(item => ({
		...item,
		name: item.from_phone
	}))
})

const fetchBroadcastDetails = async () => {
	const broadcastId = route.params.id
	if(typeof broadcastId !== 'string') return

	loading.value = true
	try {
		const { data: response } = await API.broadcast.get(broadcastId)
		broadcast.value = response.data
	} catch(error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

const refreshData = (forced?: boolean) => {
    if (!canRefresh.value && !forced) return

    canRefresh.value = false

    fetchBroadcastDetails()
	fetchDataPage(1, rowsPerPage.value)

    setTimeout(() => {
        canRefresh.value = true
    }, 3000)
}

fetchBroadcastDetails()
fetchDataPage(1, rowsPerPage.value)
</script>

<template>
	<div class="flex flex-col gap-8 h-full p-6">
		<div class="flex justify-between items-center">
			<div class="flex items-center gap-2">
                <Button class="p-1!" variant="text" @click="router.back()" severity="secondary">
                    <IconArrowLeft size="22" />
                </Button>
				<div v-if="!broadcast">
					<h1 class="font-semibold text-xl">--</h1>
				</div>
                <div v-else-if="broadcast.scheduled_at">
                    <h1 class="font-semibold text-xl">{{ broadcast.name }}</h1>
                    <div class="flex items-center gap-2">
						<div class="font-medium text-gray-400">{{ moment(broadcast.scheduled_at).format('DD MMM YY, hh:mm A') }}</div>
						<div>
							<Tag 
								:value="$t(`broadcasts.status.${broadcast.status ?? 'queued'}`)"
								:severity="broadcastSeverity(broadcast.status ?? 'queued')"
							/>
						</div>
					</div>
                </div>
				<div v-else class="flex gap-2 items-end">
					<h1 class="font-semibold text-2xl">{{ broadcast.name }}</h1>
					<div>
						<Tag 
							:value="$t(`broadcasts.status.${broadcast.status ?? 'queued'}`)"
							:severity="broadcastSeverity(broadcast.status ?? 'queued')"
						/>
					</div>
				</div>
            </div>

			<div>
				<div class="flex gap-2">
					<Button 
						class="bg-white! border-slate-200! hover:bg-slate-100!"
						severity="secondary"
						:disabled="!canRefresh || loading"
						@click="() => refreshData()"
					>
						<IconRefresh 
							v-if="loading" 
							class="animate-spin" 
							size="16"
						/>
						<IconRefresh v-else size="16" />
					</Button>

					<Button 
						:disabled="true"
						@click="() => {}"
					>
						<IconLoader2
							v-if="loading" 
							class="animate-spin" 
							size="16"
						/>
						<div v-else class="flex gap-2">
							<IconDownload size="16" />
							{{ $t('broadcasts.download_report') }}
						</div>
					</Button>
				</div>
			</div>
		</div>

		<div class="grid gap-4 grid-cols-3 lg:grid-cols-6">
			<ValueCard 
				v-for="item in overviewCards" 
				:key="item.key"
				:icon="item.icon"
				:colorClass="item.colorClass"
				:label="item.label.toUpperCase()"
				:count="item.count"
				:percentage="item.percentage"
				:loading="loading"
			/>
		</div>

		<div class="flex items-center gap-12">
			<div class="flex gap-2">
				<div class="text-lg">
					{{ $t('broadcast_details.groups', broadcast?.groups.length ?? 0) }}
				</div>
				<div 
					v-if="broadcast?.groups"
					class="flex items-center" 
					v-tooltip.bottom="{
						value: broadcast?.groups.map(g => g.name).join(`\n`),
						class: 'max-w-[300px]!'
					}"
				>
					<IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="14" />
				</div>
			</div>

			<span class="flex items-center gap-2 text-lg">
				<div>{{ $t('broadcast_details.selected_number') }}</div>
				<div class="text-gray-400">
					{{ broadcast?.phone_number.display_phone_number }}
				</div>
			</span>
		</div>

		<Table 
			:data="transformedData"
			:columns="columns"
			emptyMessage="broadcast_details.messages_empty"
			:loading="loadingMessages"
			withPagination
			:totalRecords="dataPage.meta.total"
			v-model:rowsPerPage="rowsPerPage"
			:currentPageReport="currentPageReport"
			@onPage="onPage"
		>
			<template #name="{ data }: { data: MessageItem }">
				<div class="flex items-center gap-2">
					<Avatar
						:label="'Max Power'.charAt(0).toLocaleUpperCase()"
						shape="circle"
					/>
					{{ 'Max Power' }}
				</div>
			</template>

			<template #status="{ data }: { data: MessageItem }">
				<div class="flex items-center gap-2">
					<component :is="statusIcon[data.status].icon" class="w-5 h-5" :class="statusIcon[data.status].class" />
					<span class="uppercase text-gray-400">
						{{ $t(`message_status.${data.status}`) }}
					</span>
				</div>
			</template>
		</Table>
	</div>
</template>