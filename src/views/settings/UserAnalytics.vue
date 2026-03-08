<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import { IconArrowLeft, IconRefresh, IconInfoCircle } from '@tabler/icons-vue'
import DashboardStatCard from '~/components/dashboard/DashboardStatCard.vue'
import { useDateRangeFilter } from '~/composables/useDateRangeFilter'
import { useDurationFormatter } from '~/composables/useDurationFormatter'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type {
  UserAnalyticsData,
  UserActivityLogItem,
  AvailabilityTimeSeriesPoint,
  ConversationsUserTimeSeriesPoint,
  Column,
} from '~/types'

type SeriesData = {
  name: string
  data: number[]
}

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const userId = route.params.userId as string

const {
  periodOptions,
  selectedPeriod,
  dateRange,
  dateRangeError,
  startDate,
  endDate,
  canRefresh,
  refreshKey,
  refreshData,
} = useDateRangeFilter()

const loading = ref(false)
const analyticsData = ref<UserAnalyticsData | null>(null)
const userName = ref('')

const availabilityOptions = ref({})
const availabilitySeries = ref<SeriesData[]>([])

const conversationsOptions = ref({})
const conversationsSeries = ref<SeriesData[]>([])

const {
  dataPage: activityPage,
  loading: loadingActivity,
  rowsPerPage,
  currentPageReport,
  fetchDataPage,
  onPage,
} = usePaginatedData<UserActivityLogItem>(
  (page, perPage) => {
    const params: Record<string, string> = {}
    if (startDate.value) params.start_date = startDate.value
    if (endDate.value) params.end_date = endDate.value
    return API.userAnalytics.activityLogs(userId, page, perPage, params).then((res) => res.data)
  },
  10,
)

const activityTypeSeverity = (type: string): string => {
  const map: Record<string, string> = {
    login: 'info',
    logout: 'warn',
    available: 'success',
    unavailable: 'danger',
  }
  return map[type] ?? 'secondary'
}

const columns = computed<Column[]>(() => [
  { header: t('user_analytics.activity_headers.type'), key: 'typeTag', type: 'TAG' },
  { header: t('user_analytics.activity_headers.ip_address'), key: 'ip_display' },
  { header: t('user_analytics.activity_headers.user_agent'), key: 'user_agent_display' },
  { header: t('user_analytics.activity_headers.date'), key: 'created_at' },
])

const transformedActivityData = computed(() => {
  return activityPage.value.data.map((item) => ({
    ...item,
    typeTag: {
      label: t(`user_analytics.activity_types.${item.type}`),
      severity: activityTypeSeverity(item.type),
    },
    created_at: moment(item.created_at).format('DD/MM/YYYY HH:mm'),
    ip_display: item.ip_address ?? '-',
    user_agent_display: item.user_agent ?? '-',
  }))
})

const { formatMinutes, formatHours } = useDurationFormatter()

const buildChartOptions = (categories: string[]) => ({
  chart: {
    type: 'line',
    toolbar: { show: false },
    zoom: { enabled: false },
    background: 'transparent',
  },
  xaxis: {
    categories,
    tickAmount: Math.min(categories.length, 15),
    labels: {
      rotate: -45,
      rotateAlways: categories.length > 15,
    },
  },
  stroke: { curve: 'smooth' as const },
  legend: { position: 'bottom' as const },
  tooltip: { shared: true },
  noData: {
    text: t('dashboard.charts.no_data'),
    align: 'center' as const,
    verticalAlign: 'middle' as const,
    style: { fontSize: '14px', color: '#94a3b8' },
  },
})

const clearCharts = () => {
  availabilitySeries.value = []
  availabilityOptions.value = buildChartOptions([])
  conversationsSeries.value = []
  conversationsOptions.value = buildChartOptions([])
}

const renderCharts = () => {
  if (!analyticsData.value?.availability_chart || !analyticsData.value?.conversations_chart) {
    clearCharts()
    return
  }

  const availCategories = analyticsData.value.availability_chart.map(
    (d: AvailabilityTimeSeriesPoint) => d.period,
  )
  availabilitySeries.value = [
    {
      name: t('user_analytics.charts.available_hours'),
      data: analyticsData.value.availability_chart.map(
        (d: AvailabilityTimeSeriesPoint) => d.hours,
      ),
    },
  ]
  availabilityOptions.value = buildChartOptions(availCategories)

  const convCategories = analyticsData.value.conversations_chart.map(
    (d: ConversationsUserTimeSeriesPoint) => d.period,
  )
  conversationsSeries.value = [
    {
      name: t('user_analytics.charts.taken'),
      data: analyticsData.value.conversations_chart.map(
        (d: ConversationsUserTimeSeriesPoint) => d.taken,
      ),
    },
    {
      name: t('user_analytics.charts.resolved'),
      data: analyticsData.value.conversations_chart.map(
        (d: ConversationsUserTimeSeriesPoint) => d.resolved,
      ),
    },
  ]
  conversationsOptions.value = buildChartOptions(convCategories)
}

const fetchAnalytics = async () => {
  loading.value = true

  const params: Record<string, string> = {}
  if (startDate.value) params.start_date = startDate.value
  if (endDate.value) params.end_date = endDate.value

  try {
    const { data: response } = await API.userAnalytics.index(userId, params)
    analyticsData.value = response.data
    renderCharts()
  } catch (error) {
    console.error(error)
  }

  loading.value = false
}

const fetchUserName = async () => {
  try {
    const { data: response } = await API.user.index()
    const user = response.data.find((u) => u.id === userId)
    if (user) userName.value = user.name
  } catch {
    // ignore
  }
}

watch(
  () => [startDate.value, endDate.value, refreshKey.value],
  () => {
    fetchAnalytics()
    fetchDataPage(1, rowsPerPage.value)
  },
)

watch(rowsPerPage, () => fetchDataPage(1, rowsPerPage.value))

fetchAnalytics()
fetchDataPage(1, rowsPerPage.value)
fetchUserName()
clearCharts()
</script>

<template>
  <div class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <Button
          class="p-1!"
          variant="text"
          severity="secondary"
          @click="router.push({ name: 'users-teams-roles' })"
        >
          <IconArrowLeft size="22" />
        </Button>
        <h1 class="text-2xl font-bold">
          {{ userName || $t('user_analytics.title') }}
        </h1>
      </div>

      <div class="flex flex-col items-end gap-1">
        <div class="flex gap-3 items-center">
          <Button
            class="bg-white! border-slate-200! hover:bg-slate-100!"
            severity="secondary"
            :disabled="!canRefresh"
            @click="refreshData"
          >
            <IconRefresh size="16" />
          </Button>
          <Select
            v-model="selectedPeriod"
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48"
          />
          <DatePicker
            v-model="dateRange"
            selectionMode="range"
            :manualInput="false"
            showIcon
            iconDisplay="input"
            :placeholder="$t('dashboard.select_date_range')"
          >
            <template #footer>
              <Divider class="my-2!" />
              <div class="flex justify-between">
                <Button
                  class="text-base!"
                  variant="text"
                  size="small"
                  @click="dateRange = [new Date(), new Date()]"
                >
                  {{ $t('today') }}
                </Button>
                <Button class="text-base!" variant="text" size="small" @click="dateRange = null">
                  {{ $t('reset') }}
                </Button>
              </div>
            </template>
          </DatePicker>
        </div>
        <span v-if="dateRangeError" class="text-sm text-red-500">{{ dateRangeError }}</span>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <DashboardStatCard
        :label="t('user_analytics.stats.active_conversations')"
        :count="analyticsData?.stats.active_conversations ?? 0"
        :tooltip="t('user_analytics.tooltips.active_conversations')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('user_analytics.stats.resolved')"
        :count="analyticsData?.stats.resolved ?? 0"
        :tooltip="t('user_analytics.tooltips.resolved')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('user_analytics.stats.messages_sent')"
        :count="analyticsData?.stats.messages_sent ?? 0"
        :tooltip="t('user_analytics.tooltips.messages_sent')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('user_analytics.stats.avg_resolution_time')"
        :count="formatMinutes(analyticsData?.stats.avg_resolution_time_minutes ?? null)"
        :tooltip="t('user_analytics.tooltips.avg_resolution_time')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('user_analytics.stats.avg_first_response_time')"
        :count="formatMinutes(analyticsData?.stats.avg_first_response_time_minutes ?? null)"
        :tooltip="t('user_analytics.tooltips.avg_first_response_time')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('user_analytics.stats.avg_available_hours')"
        :count="formatHours(analyticsData?.stats.avg_available_hours ?? null)"
        :tooltip="t('user_analytics.tooltips.avg_available_hours')"
        :loading="loading"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">{{
            t('user_analytics.charts.available_hours')
          }}</span>
          <IconInfoCircle
            v-tooltip.top="t('user_analytics.charts.available_hours_tooltip')"
            class="w-[16px] h-[16px] text-gray-400 cursor-help"
          />
        </div>
        <apexchart
          type="line"
          height="300"
          :options="availabilityOptions"
          :series="availabilitySeries"
        />
        <p class="text-sm text-gray-500">
          {{ t('user_analytics.charts.available_hours_description') }}
        </p>
      </div>

      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">{{
            t('user_analytics.charts.conversations')
          }}</span>
          <IconInfoCircle
            v-tooltip.top="t('user_analytics.charts.conversations_tooltip')"
            class="w-[16px] h-[16px] text-gray-400 cursor-help"
          />
        </div>
        <apexchart
          type="line"
          height="300"
          :options="conversationsOptions"
          :series="conversationsSeries"
        />
        <p class="text-sm text-gray-500">
          {{ t('user_analytics.charts.conversations_description') }}
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">{{ t('user_analytics.activity_log') }}</h2>
      <Table
        :data="transformedActivityData"
        :columns="columns"
        :loading="loadingActivity"
        emptyMessage="user_analytics.no_activity"
        withPagination
        :totalRecords="activityPage.meta.total"
        v-model:rowsPerPage="rowsPerPage"
        :currentPageReport="currentPageReport"
        @onPage="onPage"
      />
    </div>
  </div>
</template>

<style lang="css" scoped>
:deep(.p-datatable-paginator-bottom) {
  border: none;
}
</style>
