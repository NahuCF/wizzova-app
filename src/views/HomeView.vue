<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'
import { IconChartBar, IconUsers, IconRefresh } from '@tabler/icons-vue'
import DashboardOverviewTab from '~/components/dashboard/DashboardOverviewTab.vue'
import DashboardAgentsTab from '~/components/dashboard/DashboardAgentsTab.vue'

const MAX_RANGE_DAYS = 90

const { t } = useI18n()

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

const startDate = ref<string | null>(null)
const endDate = ref<string | null>(null)
const canRefresh = ref(true)
const refreshKey = ref(0)

const refreshData = () => {
  if (!canRefresh.value) return
  canRefresh.value = false
  refreshKey.value++
  setTimeout(() => {
    canRefresh.value = true
  }, 3000)
}

const computeDateStrings = () => {
  startDate.value =
    dateRange.value && dateRange.value[0]
      ? moment(dateRange.value[0]).format('YYYY-MM-DD')
      : null
  endDate.value =
    dateRange.value && dateRange.value[1]
      ? moment(dateRange.value[1]).format('YYYY-MM-DD')
      : null
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
  computeDateStrings()
}

watch(selectedPeriod, (val) => {
  dateRangeError.value = ''
  if (val === 'custom') return

  settingDateFromPeriod.value = true
  applyPeriodDates(val)
  nextTick(() => {
    settingDateFromPeriod.value = false
  })
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
      computeDateStrings()
    } else if (!val) {
      dateRangeError.value = ''
      settingDateFromPeriod.value = true
      selectedPeriod.value = 'all'
      computeDateStrings()
      nextTick(() => {
        settingDateFromPeriod.value = false
      })
    }
  },
  { deep: true },
)

settingDateFromPeriod.value = true
applyPeriodDates(selectedPeriod.value)
nextTick(() => {
  settingDateFromPeriod.value = false
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-0">
      <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>

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

    <Tabs value="0" class="py-4" lazy>
      <TabList class="text-lg">
        <Tab value="0">
          <div class="flex items-center gap-2 text-inherit">
            <IconChartBar size="16" />
            <span>{{ $t('dashboard.tabs.overview') }}</span>
          </div>
        </Tab>
        <Tab value="1">
          <div class="flex items-center gap-2 text-inherit">
            <IconUsers size="16" />
            <span>{{ $t('dashboard.tabs.agents') }}</span>
          </div>
        </Tab>
      </TabList>
      <TabPanels class="p-6!">
        <TabPanel value="0">
          <DashboardOverviewTab :start-date="startDate" :end-date="endDate" :refresh-key="refreshKey" />
        </TabPanel>
        <TabPanel value="1">
          <DashboardAgentsTab :start-date="startDate" :end-date="endDate" :refresh-key="refreshKey" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
