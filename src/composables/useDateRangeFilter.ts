import { ref, watch, nextTick } from 'vue'
import moment from 'moment'
import { useI18n } from 'vue-i18n'

const MAX_RANGE_DAYS = 90

export function useDateRangeFilter(defaultPeriod = '7') {
  const { t } = useI18n()

  const periodOptions = [
    { label: t('dashboard.periods.all_time'), value: 'all' },
    { label: t('dashboard.periods.today'), value: 'today' },
    { label: t('dashboard.periods.last_7_days'), value: '7' },
    { label: t('dashboard.periods.last_30_days'), value: '30' },
    { label: t('dashboard.periods.last_90_days'), value: '90' },
    { label: t('dashboard.periods.custom'), value: 'custom' },
  ]

  const selectedPeriod = ref(defaultPeriod)
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

  return {
    periodOptions,
    selectedPeriod,
    dateRange,
    dateRangeError,
    startDate,
    endDate,
    canRefresh,
    refreshKey,
    refreshData,
    MAX_RANGE_DAYS,
  }
}
