<script setup lang="ts">
import { computed, ref } from 'vue'
import moment from 'moment'
import { useToast, type DataTablePageEvent } from 'primevue'
import { useRouter } from 'vue-router'
import { API } from '~/services'
import { useSeverityMapper } from '~/composables/useSeverityMapper'
import type { BroadcastItem, BroadcastRepeat, Column, Page } from '~/types'
import WarningDialog from '~/components/WarningDialog.vue'
import { useI18n } from 'vue-i18n'
import { IconDownload, IconLoader2, IconRepeat, IconTrash } from '@tabler/icons-vue'

const props = defineProps<{
	dataPage: Page<BroadcastItem>,
	rowsPerPage: number,
	currentPageReport: string,
	loading?: boolean,
	fetchData: () => void,
	onPage: ((event: DataTablePageEvent) => any)
}>()

const emit = defineEmits<{
	(e: 'update:rowsPerPage', value: number): void
}>()

const router = useRouter()
const toast = useToast()
const { t } = useI18n()
const { broadcastSeverity } = useSeverityMapper()

const loadingCancel = ref(false)
const showCancelDialog = ref(false)
const cancelId = ref('')

const loadingRepeat = ref(false)
const showRepeatDialog = ref(false)
const selectedBroadcast = ref<BroadcastItem>()

const columns: Column[] = [
	{ header: t('broadcasts.headers.name'), key: 'name' },
	{ header: t('broadcasts.headers.created_at'), key: 'createdAtFormatted' },
	{ header: t('broadcasts.headers.created_by'), key: 'createdByFormatted' },
	{ header: t('broadcasts.headers.recipients'), key: 'recipients_count' },
	{ header: t('broadcasts.headers.sent'), key: 'sentCount', type: 'PROGRESS' },
	{ header: t('broadcasts.headers.delivered'), key: 'deliveredCount', type: 'PROGRESS' },
	{ header: t('broadcasts.headers.readed'), key: 'readedCount', type: 'PROGRESS' },
	{ header: t('broadcasts.headers.failed'), key: 'failedCount', type: 'PROGRESS' },
	{ header: t('broadcasts.headers.status'), key: 'statusTag', type: 'CUSTOM' },
	{ header: t('actions'), key: 'actions', type: 'ACTIONS' }
]

const broadcastActions = (item: BroadcastItem) => {
    const downloadReport = {
        label: t('broadcasts.download_report'),
        icon: IconDownload,
        class: '',
        disabled: true,
        action: () => {
            // TODO: Download report
        }
    }
	const repeatBroadcast = {
        label: t('broadcasts.repeat_broadcast'),
        icon: IconRepeat,
        class: '',
        disabled: !item.template_id || loadingRepeat.value,
		tooltip: !item.template_id && t('broadcasts.missing_template'),
        action: () => {
            selectedBroadcast.value = item
			showRepeatDialog.value = true
        }
    }
    const cancel = {
        label: t('broadcasts.cancel_broadcast'),
        class: 'text-red-600',
        icon: props.loading || loadingCancel.value ? IconLoader2 : IconTrash,
        iconClass: props.loading || loadingCancel.value ? 'animate-spin' : '',
        disabled: props.loading || loadingCancel.value,
        action: async () => {
            try {
                cancelId.value = item.id
                showCancelDialog.value = true
            } catch(error) {
                console.log(error)
            }
        }
    }

	let actions = [ [ downloadReport ] ]

    if (item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'failed') {
        actions = [
			...actions,
			[ cancel ]
		]
    }

	if (item.status === 'completed') {
		actions[0] = [
			...actions[0],
			repeatBroadcast
		]
	}

	return actions
}

const transformedData = computed(() => {
	return props.dataPage.data.map(item => {
		const recipients = item.recipients_count ?? 0
		const sent = item.sent_count ?? 0
		const delivered = item.delivered_count ?? 0
		const readed = item.readed_count ?? 0
		const failed = item.failed_count ?? 0

		return {
			...item,
			createdAtFormatted: moment(item.created_at).format('DD/MM/YYYY'),
			createdByFormatted: item.user.name,
			sentCount: { 
				count: sent, 
				percentage: recipients ? Math.round((sent / recipients) * 100) : 0, 
				color: 'stroke-gray-500'
			},
			deliveredCount: { 
				count: delivered, 
				percentage: recipients ? Math.round((delivered / recipients) * 100) : 0, 
				color: 'stroke-neutral-900'
			},
			readedCount: { 
				count: readed, 
				percentage: recipients ? Math.round((readed / recipients) * 100) : 0, 
				color: 'stroke-sky-600'
			},
			failedCount: { 
				count: failed, 
				percentage: recipients ? Math.round((failed / recipients) * 100) : 0, 
				color: 'stroke-red-600'
			},
			actions: broadcastActions
		}
	})
})

const goToShow = (event: { data: BroadcastItem }) => {
	router.push({ name: 'broadcast-details', params: { id: event.data.id } })
}

const onCancel = async () => {
	loadingCancel.value = true
	try {
		await API.broadcast.updateStatus(cancelId.value, 'cancelled')
		showCancelDialog.value = false
		toast.add({ 
			severity: 'success',
			summary: 'Success', 
			detail: t('broadcasts.broadcast_canceled'), 
			life: 3000 
		})
		props.fetchData()
	} finally {
		loadingCancel.value = false
	}
}

const onRepeat = async (data: BroadcastRepeat) => {
	if(!selectedBroadcast.value) return

	loadingRepeat.value = true
	try {
		const { data: response } = await API.broadcast.repeat(selectedBroadcast.value.id, data)
		showRepeatDialog.value = false
		toast.add({ 
			severity: 'success', 
			summary: 'Success', 
			detail: t('new_broadcast.broadcast_created'), 
			life: 3000
		})
		
		router.push({ name: 'broadcast-details', params: { id: response.data.id } })
	} finally {
		loadingRepeat.value = false
	}
}
</script>

<template>
	<Table 
		:data="transformedData"
		:columns="columns"
		emptyMessage="broadcasts.empty"
		:loading="loading"
		withPagination
		:totalRecords="dataPage.meta.total"
		:currentPageReport="currentPageReport"
		hoverable
		:rowsPerPage="rowsPerPage"
		@update:rows-per-page="emit('update:rowsPerPage', $event)"
		@onPage="onPage"
		@onRowClick="goToShow"
	>
		<template #statusTag="{ data }: { data: BroadcastItem }">
			<div>
				<Tag 
					:value="$t(`broadcasts.status.${data.status ?? 'queued'}`)"
					:severity="broadcastSeverity(data.status ?? 'queued')"
					class="text-base!"
					v-tooltip.bottom="data.scheduled_at && data.status === 'scheduled' && {
						value: moment(data.scheduled_at).format('DD-MM-YYYY'),
						class: 'text-base max-w-[300px]!'
					}"
				/>
			</div>
		</template>
	</Table>

	<WarningDialog 
		v-model:visible="showCancelDialog" 
		:title="$t('broadcasts.cancel_broadcast')"
		:message="$t('broadcasts.cancel_message')"
		:confirm-message="$t('confirm')"
		:loading="loadingCancel"
		@onConfirm="onCancel"
	/>

	<RepeatBroadcastDialog
		v-model:visible="showRepeatDialog"
		:loading="loadingRepeat"
		@onConfirm="onRepeat"
	/>
</template>
