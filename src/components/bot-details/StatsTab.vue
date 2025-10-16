<script setup lang="ts">
import { ref, watch } from 'vue'
import moment from 'moment'
import { IconCircleCheck, IconClock, IconExclamationCircle, IconMessage, IconWifi } from '@tabler/icons-vue'
import type { BotAnalytics, BotAnalyticsFilters } from '~/types'
import { API } from '~/services'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ botId?: string }>()

const { t } = useI18n()

const dateRange = ref<(Date | null)[] | null>([
	moment().subtract(1, 'week').toDate(),
	moment().toDate()
])

const analytics = ref<BotAnalytics | null>(null)
const loading = ref(false)

const overview = ref({
	active_sessions: 0,
	total_sessions: 0,
	completed_sessions: 0,
	abandoned_sessions: 0,
	avg_duration_seconds: 0
})

const sessionsOptions = ref({})
const usersOptions = ref({})
const durationOptions = ref({})

const fetchAnalytics = async () => {
	if (!props.botId || !dateRange.value) return
	if (dateRange.value.length !== 2 || dateRange.value[0] === null || dateRange.value[1] === null) return

	loading.value = true
	const filters: BotAnalyticsFilters = {
		start_date: moment(dateRange.value[0]).format('YYYY-MM-DD'),
		end_date: moment(dateRange.value[1]).format('YYYY-MM-DD')
	}

	const { data: response } = await API.bot.analytics(props.botId, filters)
	
	analytics.value = response.data
	overview.value = analytics.value.overview
	loading.value = false
	renderCharts()
}

const renderCharts = () => {
	if (!analytics.value) return
	const categories = analytics.value.time_series.map(d => d.period)

	sessionsOptions.value = {
		backgroundColor: 'white',
		title: {
			text: t('bot_details.stats.sessions'),
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: '500' }
		},
		tooltip: { trigger: 'axis' },
		legend: { data: ['Completadas', 'Abandonadas', 'Total'], bottom: 0 },
		xAxis: { type: 'category', data: categories },
		yAxis: { 
			type: 'value', 
			min: 0,
			max: 5,
			minInterval: 1,
			splitNumber: 6 
		},
		series: [
			{ name: 'Completadas', type: 'line', data: analytics.value.time_series.map(d => d.completed_sessions) },
			{ name: 'Abandonadas', type: 'line', data: analytics.value.time_series.map(d => d.abandoned_sessions) },
			{ name: 'Total', type: 'line', data: analytics.value.time_series.map(d => d.opened_sessions) }
		],
		grid: { top: 50, bottom: 30, left: 30, right: 30, containLabel: true }
	}

	usersOptions.value = {
		backgroundColor: 'white',
		title: {
			text: t('bot_details.stats.unique_users'),
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: '500' }
		},
		tooltip: { trigger: 'axis' },
		xAxis: { type: 'category', data: categories },
		yAxis: { 
			type: 'value', 
			min: 0,
			max: 5,
			minInterval: 1,
			splitNumber: 6 
		},
		series: [
			{ name: 'Usuarios únicos', type: 'line', data: analytics.value.time_series.map(d => d.unique_users) }
		],
		grid: { top: 50, bottom: 30, left: 30, right: 30, containLabel: true }
	}

	durationOptions.value = {
		backgroundColor: 'white',
		title: {
			text: t('bot_details.stats.avg_duration_chart'),
			left: 'center',
			textStyle: { fontSize: 16, fontWeight: '500' }
		},
		tooltip: { trigger: 'axis' },
		xAxis: { type: 'category', data: categories },
		yAxis: { 
			type: 'value', 
			min: 0,
			max: 5,
			minInterval: 1,
			splitNumber: 6 
		},
		series: [
			{ name: 'Duración promedio (min)', type: 'line', data: analytics.value.time_series.map(d => +(d.avg_duration_seconds / 60).toFixed(2)) }
		],
		grid: { top: 50, bottom: 30, left: 30, right: 30, containLabel: true }
	}
}

watch(dateRange, fetchAnalytics)
watch(() => props.botId, () => {
	if(props.botId) {
		fetchAnalytics()
	}
}, { immediate: true })
</script>

<template>
	<div class="flex flex-col gap-4">
		<div>
			<DatePicker 
				v-model="dateRange" 
				selectionMode="range" 
				:manualInput="false" 
				showIcon 
				iconDisplay="input"
				:placeholder="$t('bot_details.stats.select_date_range')"
			>
				<template #footer>
					<Divider class="my-2" />
					<div class="flex justify-between">
						<Button variant="text" size="small" @click="dateRange = [new Date(), null]">
							{{ $t('bot_details.stats.today') }}
						</Button>
						<Button variant="text" size="small" @click="dateRange = null">
							{{ $t('bot_details.stats.reset') }}
						</Button>
					</div>
				</template>
			</DatePicker>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-5 gap-4">
			<ValueCard 
				:icon="IconWifi" 
				colorClass='text-gray-500' 
				:label="$t('bot_details.stats.active_sessions')"
				:count="overview.active_sessions" 
				:loading="loading" 
			/>
			<ValueCard 
				:icon="IconMessage" 
				colorClass='text-gray-500' 
				:label="$t('bot_details.stats.total_sessions')"
				:count="overview.total_sessions" 
				:loading="loading" 
			/>
			<ValueCard 
				:icon="IconCircleCheck" 
				colorClass='text-green-600' 
				:label="$t('bot_details.stats.completed_sessions')"
				:count="overview.completed_sessions" 
				:loading="loading" 
			/>
			<ValueCard 
				:icon="IconExclamationCircle" 
				colorClass='text-red-600' 
				:label="$t('bot_details.stats.abandoned_sessions')"
				:count="overview.abandoned_sessions" 
				:loading="loading" 
			/>
			<ValueCard 
				:icon="IconClock" 
				colorClass='text-gray-500' 
				:label="$t('bot_details.stats.avg_duration')"
				:count="Math.round(overview.avg_duration_seconds / 60)" 
				:loading="loading" 
			/>
		</div>

		<div class="flex flex-col gap-4">
			<div class="p-4 bg-white border border-slate-200 rounded-lg">
				<VueECharts :option="sessionsOptions" class="min-h-[300px]!" autoresize />
			</div>
			
			<div class="flex gap-4">
				<div class="p-4 bg-white border border-slate-200 rounded-lg w-1/2">
					<VueECharts :option="usersOptions" class="h-[300px]!" autoresize />
				</div>

				<div class="p-4 bg-white border border-slate-200 rounded-lg w-1/2">
					<VueECharts :option="durationOptions" class="h-[300px]!" autoresize />
				</div>
			</div>
		</div>
	</div>
</template>