<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { IconInfoCircle } from '@tabler/icons-vue'
import DashboardStatCard from '~/components/dashboard/DashboardStatCard.vue'
import { API } from '~/services'
import type { DashboardData } from '~/types'

type SeriesData = {
  name: string
  data: number[]
}

const MAX_RANGE_DAYS = 90

const { t } = useI18n()

const loading = ref(false)
const dashboardData = ref<DashboardData | null>(null)

const periodOptions = [
  { label: t('dashboard.periods.all_time'), value: 'all' },
  { label: t('dashboard.periods.today'), value: 'today' },
  { label: t('dashboard.periods.last_7_days'), value: '7' },
  { label: t('dashboard.periods.last_30_days'), value: '30' },
  { label: t('dashboard.periods.last_90_days'), value: '90' },
  { label: t('dashboard.periods.custom'), value: 'custom' },
]

const selectedPeriod = ref('7')
const dateRange = ref<(Date | null)[] | null>(null)
const dateRangeError = ref('')
const settingDateFromPeriod = ref(false)

const conversationsOptions = ref({})
const conversationsSeries = ref<SeriesData[]>([])

const contactsOptions = ref({})
const contactsSeries = ref<SeriesData[]>([])

const messagesOptions = ref({})
const messagesSeries = ref<SeriesData[]>([])

const categoryOptions = ref({})
const categorySeries = ref<SeriesData[]>([])

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
  conversationsSeries.value = []
  conversationsOptions.value = buildChartOptions([])
  contactsSeries.value = []
  contactsOptions.value = buildChartOptions([])
  messagesSeries.value = []
  messagesOptions.value = buildChartOptions([])
  categorySeries.value = []
  categoryOptions.value = buildChartOptions([])
}

const renderCharts = () => {
  if (
    !dashboardData.value?.conversations_chart ||
    !dashboardData.value?.contacts_chart ||
    !dashboardData.value?.messages_chart ||
    !dashboardData.value?.category_chart
  ) {
    clearCharts()
    return
  }

  const convCategories = dashboardData.value.conversations_chart.map((d) => d.period)
  conversationsSeries.value = [
    {
      name: t('dashboard.charts.conversations'),
      data: dashboardData.value.conversations_chart.map((d) => d.count),
    },
  ]
  conversationsOptions.value = buildChartOptions(convCategories)

  const contactCategories = dashboardData.value.contacts_chart.map((d) => d.period)
  contactsSeries.value = [
    {
      name: t('dashboard.charts.new_contacts'),
      data: dashboardData.value.contacts_chart.map((d) => d.count),
    },
  ]
  contactsOptions.value = buildChartOptions(contactCategories)

  const msgCategories = dashboardData.value.messages_chart.map((d) => d.period)
  messagesSeries.value = [
    {
      name: t('dashboard.charts.sent'),
      data: dashboardData.value.messages_chart.map((d) => d.sent),
    },
    {
      name: t('dashboard.charts.delivered'),
      data: dashboardData.value.messages_chart.map((d) => d.delivered),
    },
    {
      name: t('dashboard.charts.read'),
      data: dashboardData.value.messages_chart.map((d) => d.read),
    },
    {
      name: t('dashboard.charts.failed'),
      data: dashboardData.value.messages_chart.map((d) => d.failed),
    },
  ]
  messagesOptions.value = buildChartOptions(msgCategories)

  const catCategories = dashboardData.value.category_chart.map((d) => d.period)
  categorySeries.value = [
    {
      name: t('dashboard.charts.user_initiated'),
      data: dashboardData.value.category_chart.map((d) => d.user),
    },
    {
      name: t('dashboard.charts.business_initiated'),
      data: dashboardData.value.category_chart.map((d) => d.business),
    },
  ]
  categoryOptions.value = buildChartOptions(catCategories)
}

const fetchDashboard = async () => {
  loading.value = true

  const params: Record<string, string> = {}
  if (dateRange.value && dateRange.value[0]) {
    params.start_date = moment(dateRange.value[0]).format('YYYY-MM-DD')
  }
  if (dateRange.value && dateRange.value[1]) {
    params.end_date = moment(dateRange.value[1]).format('YYYY-MM-DD')
  }

  try {
    const { data: response } = await API.dashboard.index(params)
    dashboardData.value = response.data
    renderCharts()
  } catch (error) {
    console.error(error)
  }

  loading.value = false
}

const applyPeriodDates = (val: string) => {
  if (val === 'all') {
    dateRange.value = null
  } else if (val === 'today') {
    dateRange.value = [moment().startOf('day').toDate(), moment().endOf('day').toDate()]
  } else {
    const days = parseInt(val)
    dateRange.value = [moment().subtract(days, 'days').toDate(), moment().toDate()]
  }
}

watch(selectedPeriod, (val) => {
  dateRangeError.value = ''
  if (val === 'custom') return

  settingDateFromPeriod.value = true
  applyPeriodDates(val)
  nextTick(() => {
    settingDateFromPeriod.value = false
  })
  fetchDashboard()
})

watch(
  dateRange,
  (val) => {
    if (settingDateFromPeriod.value) return

    if (val && val[0] && val[1]) {
      const diff = moment(val[1]).diff(moment(val[0]), 'days')
      if (diff > MAX_RANGE_DAYS) {
        dateRangeError.value = t('dashboard.max_range_error', { days: MAX_RANGE_DAYS })
        return
      }
      dateRangeError.value = ''
      selectedPeriod.value = 'custom'
      fetchDashboard()
    } else if (!val) {
      dateRangeError.value = ''
      settingDateFromPeriod.value = true
      selectedPeriod.value = 'all'
      nextTick(() => {
        settingDateFromPeriod.value = false
      })
      fetchDashboard()
    }
  },
  { deep: true },
)

// Initial load with default period
applyPeriodDates(selectedPeriod.value)
fetchDashboard()
clearCharts()
</script>

<template>
  <main class="flex flex-col gap-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>

      <div class="flex flex-col items-end gap-1">
        <div class="flex gap-3 items-center">
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
        :label="$t('dashboard.stats.open_conversations')"
        :count="dashboardData?.overview.open_conversations ?? 0"
        :tooltip="$t('dashboard.tooltips.open_conversations')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="$t('dashboard.stats.resolved_conversations')"
        :count="dashboardData?.overview.resolved_conversations ?? 0"
        :tooltip="$t('dashboard.tooltips.resolved_conversations')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="$t('dashboard.stats.conversations')"
        :count="dashboardData?.overview.total_conversations ?? 0"
        :tooltip="$t('dashboard.tooltips.conversations')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="$t('dashboard.stats.new_contacts')"
        :count="dashboardData?.overview.new_contacts ?? 0"
        :tooltip="$t('dashboard.tooltips.new_contacts')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="$t('dashboard.stats.user_initiated')"
        :count="dashboardData?.overview.user_initiated ?? 0"
        :tooltip="$t('dashboard.tooltips.user_initiated')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="$t('dashboard.stats.business_initiated')"
        :count="dashboardData?.overview.business_initiated ?? 0"
        :tooltip="$t('dashboard.tooltips.business_initiated')"
        :loading="loading"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">{{ $t('dashboard.charts.conversations') }}</span>
          <IconInfoCircle
            v-tooltip.top="$t('dashboard.charts.conversations_tooltip')"
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
          {{ $t('dashboard.charts.conversations_description') }}
        </p>
      </div>

      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">{{ $t('dashboard.charts.new_contacts') }}</span>
          <IconInfoCircle
            v-tooltip.top="$t('dashboard.charts.new_contacts_tooltip')"
            class="w-[16px] h-[16px] text-gray-400 cursor-help"
          />
        </div>
        <apexchart
          type="line"
          height="300"
          :options="contactsOptions"
          :series="contactsSeries"
        />
        <p class="text-sm text-gray-500">
          {{ $t('dashboard.charts.new_contacts_description') }}
        </p>
      </div>

      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">
            {{ $t('dashboard.charts.messages_by_status') }}
          </span>
          <IconInfoCircle
            v-tooltip.top="$t('dashboard.charts.messages_by_status_tooltip')"
            class="w-[16px] h-[16px] text-gray-400 cursor-help"
          />
        </div>
        <apexchart
          type="line"
          height="300"
          :options="messagesOptions"
          :series="messagesSeries"
        />
        <p class="text-sm text-gray-500">
          {{ $t('dashboard.charts.messages_by_status_description') }}
        </p>
      </div>

      <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold">
            {{ $t('dashboard.charts.conversation_by_category') }}
          </span>
          <IconInfoCircle
            v-tooltip.top="$t('dashboard.charts.conversation_by_category_tooltip')"
            class="w-[16px] h-[16px] text-gray-400 cursor-help"
          />
        </div>
        <apexchart
          type="line"
          height="300"
          :options="categoryOptions"
          :series="categorySeries"
        />
        <p class="text-sm text-gray-500">
          {{ $t('dashboard.charts.conversation_by_category_description') }}
        </p>
      </div>
    </div>
  </main>
</template>
