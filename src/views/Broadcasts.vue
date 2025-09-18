<script setup lang="ts">
import { 
    IconRefresh, IconPlus, IconUsers, IconCheck, IconChecks, 
    IconExclamationCircle, IconArrowBackUp, IconSearch, IconFilter, 
    IconStopwatch, IconCalendarClock, IconSend, IconX, IconCancel 
} from '@tabler/icons-vue'
import type { MenuItem } from 'primevue/menuitem'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import type { WABANumber, BroadcastItem, BroadcastOverview, BroadcastStatus } from '~/types'

const selectedNumber = ref<WABANumber>()
const dateRange = ref<(Date | null)[] | null>()
const selectedFilter = ref<{
    label: string,
    value: BroadcastStatus,
    iconClass: string,
    iconEl: any
}>()

const { t } = useI18n()
const router = useRouter()
const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    currentPageReport,
    fetchDataPage,
    debouncedFetch,
    onPage
} = usePaginatedData<BroadcastItem>(
    (_, perPage, search) => {
        if(!selectedNumber.value) return new Promise(resolve => resolve({ data: [], meta: {} }))

        const start_date = dateRange.value && dateRange.value[0] && dateRange.value[0].toISOString()
        const end_date = dateRange.value && dateRange.value[1] && dateRange.value[1].toISOString()

        return API.broadcast.index({
            phone_number_id: selectedNumber.value.id,
            rows_per_page: perPage,
            ...(search && { search }),
            ...(start_date && { start_date }),
            ...(end_date && { end_date }),
            ...(selectedFilter.value && { status: selectedFilter.value.value })
        }).then(res => res.data)
    },
    10
)
const sessionStore = useSessionStore()

const loadingNumbers = ref(false)
const loadingOverview = ref(true)
const canRefresh = ref(true)
const broadcastNumbers = ref<WABANumber[]>([])
const overviewData = ref<BroadcastOverview>({
    recipients_count: { count: 0, percentage: 100 },
    sent_count: { count: 0, percentage: 0 },
    delivered_count: { count: 0, percentage: 0 },
    readed_count: { count: 0, percentage: 0 },
    replied_count: { count: 0, percentage: 0 },
    failed_count: { count: 0, percentage: 0 }
})
const overviewDays = ref(7)
const overviewDaysOptions = ref([
    {
        label: t('today'),
        value: 1
    },
    {
        label: t('last_n_days', 7),
        value: 7
    },
    {
        label: t('last_n_days', 30),
        value: 30
    },
    {
        label: t('last_n_days', 90),
        value: 90
    }
])
const filterMenu = ref()
const filterOptions = ref<{
    label: string,
    value: BroadcastStatus,
    iconClass: string,
    iconEl: any
}[]>([
    {
        label: t('broadcasts.status.queued'),
        value: 'queued',
        iconClass: 'text-neutral-900',
        iconEl: IconStopwatch
    },
    {
        label: t('broadcasts.status.scheduled'),
        value: 'scheduled',
        iconClass: 'text-sky-300',
        iconEl: IconCalendarClock
    },
    {
        label: t('broadcasts.status.sending'),
        value: 'sending',
        iconClass: 'text-yellow-600',
        iconEl: IconSend
    },
    {
        label: t('broadcasts.status.sent'),
        value: 'sent',
        iconClass: 'text-green-600',
        iconEl: IconCheck
    },
    {
        label: t('broadcasts.status.failed'),
        value: 'failed',
        iconClass: 'text-red-600',
        iconEl: IconX
    },
    {
        label: t('broadcasts.status.cancelled'),
        value: 'cancelled',
        iconClass: 'text-red-600',
        iconEl: IconCancel
    }
])

const overviewCards = computed(() => [
    {
        key: 'recipients',
        label: t('broadcasts.headers.recipients'),
        icon: IconUsers,
        colorClass: '',
        count: overviewData.value.recipients_count.count
    },
    {
        key: 'sent',
        label: t('broadcasts.headers.sent'),
        icon: IconCheck,
        colorClass: 'text-gray-500',
        count: overviewData.value.sent_count.count,
        percentage: overviewData.value.sent_count.percentage
    },
    {
        key: 'received',
        label: t('broadcasts.headers.delivered'),
        icon: IconChecks,
        colorClass: 'text-neutral-900',
        count: overviewData.value.delivered_count.count,
        percentage: overviewData.value.delivered_count.percentage
    },
    {
        key: 'read',
        label: t('broadcasts.headers.readed'),
        icon: IconChecks,
        colorClass: 'text-sky-600',
        count: overviewData.value.readed_count.count,
        percentage: overviewData.value.readed_count.percentage
    },
    {
        key: 'replied',
        label: t('broadcasts.headers.replied'),
        icon: IconArrowBackUp,
        colorClass: 'text-emerald-500',
        count: overviewData.value.replied_count.count,
        percentage: overviewData.value.replied_count.percentage
    },
    {
        key: 'failed',
        label: t('broadcasts.headers.failed'),
        icon: IconExclamationCircle,
        colorClass: 'text-red-600',
        count: overviewData.value.failed_count.count,
        percentage: overviewData.value.failed_count.percentage
    }
])

const openFilterMenu = (event: MouseEvent) => {
    filterMenu.value?.toggle(event)
}

const setFilter = (filter: MenuItem) => {
    selectedFilter.value = filterOptions.value.find(f => f.label === filter.label)
}

const fetchBroadcastNumbers = async () => {
    if(!sessionStore.defaultWaba) return

    loadingNumbers.value = true
    try {
        const { data: response } = await API.broadcast.broadcastNumbers(sessionStore.defaultWaba.id)
        broadcastNumbers.value = response.data

        if(!selectedNumber.value && broadcastNumbers.value.length > 0) {
            selectedNumber.value = broadcastNumbers.value[0]
        }
    } catch(error) {
        console.log(error)
    } finally {
        loadingNumbers.value = false
    }
}

const fetchOverview = async () => {
    if(!selectedNumber.value) return

    loadingOverview.value = true
    try {
        const { data: response } = await API.broadcast.overview({
            phone_number_id: selectedNumber.value.id,
            overview_days: overviewDays.value
        })
        overviewData.value = response
    } catch(error) {
        console.log(error)
    } finally {
        loadingOverview.value = false
    }
}

const refreshData = (forced?: boolean) => {
    if (!canRefresh.value && !forced) return

    canRefresh.value = false

    fetchDataPage(1, rowsPerPage.value)
    fetchOverview()

    setTimeout(() => {
        canRefresh.value = true
    }, 3000)
}

watch(rowsPerPage, 
    () => fetchDataPage(1, rowsPerPage.value)
)

watch(selectedNumber, () => refreshData(true))
watch(overviewDays, fetchOverview)
watch(selectedFilter, () => fetchDataPage(1, rowsPerPage.value))

watch(dateRange, () => {
    const rangeSelected = dateRange.value && dateRange.value[0] && dateRange.value[1]
    const rangeCleared = dateRange.value === null
    
    if(rangeSelected || rangeCleared) {
        fetchDataPage(1, rowsPerPage.value)
    }
})

fetchBroadcastNumbers()
</script>

<template>
    <div class="flex flex-col gap-6 h-full p-6">
        <div class="flex justify-between items-center">
            <div class="flex items-center">
                <h1 class="font-semibold text-2xl">{{ $t('broadcasts.title') }}</h1>
            </div>
            <div class="flex justify-between gap-2">
                <Button 
                    class="bg-white! border-slate-200! hover:bg-slate-100!"
                    severity="secondary"
                    :disabled="!canRefresh || loading || loadingNumbers || loadingOverview"
                    @click="() => refreshData()"
                >
                    <IconRefresh 
                        v-if="loading || loadingNumbers || loadingOverview" 
                        class="animate-spin" 
                        size="16"
                    />
                    <IconRefresh v-else size="16" />
                </Button>

                <Select 
                    id="broadcastNumbers" 
                    v-model="selectedNumber" 
                    :options="broadcastNumbers" 
                    option-id="id"
                    option-label="verified_name"
                    :placeholder="$t('broadcasts.select_number')"
                    :loading="loadingNumbers"
                    :disabled="loadingNumbers"
                />

                <Button @click="router.push({ name: 'new-broadcast' })">
                    <IconPlus size="16" class="mr-1" />
                    <span>
                        {{ $t('broadcasts.new_broadcast') }}
                    </span>
                </Button>
            </div>
        </div>

        <div class="flex flex-col gap-5 p-6 bg-slate-200 rounded-lg border border-gray-300">
            <div class="flex justify-between">
                <div class="text-xl font-medium text-gray-500">{{ $t('broadcasts.overview') }}</div>
                <Select 
                    id="overviewDays" 
                    v-model="overviewDays" 
                    :options="overviewDaysOptions" 
                    option-value="value"
                    option-label="label"
                    :loading="loadingOverview"
                    :disabled="loadingOverview"
                />
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
                    :loading="loadingOverview"
                />
            </div>
        </div>

        <div class="flex justify-between items-center">
            <div class="font-semibold text-xl">{{ $t('broadcasts.all_broadcasts') }}</div>
            <div class="flex gap-2">
                <div class="relative">
                    <IconSearch size="16" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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

                <DatePicker
                    v-model="dateRange"
                    selectionMode="range"
                    :manualInput="false"
                    showIcon
                    iconDisplay="input"

                    :placeholder="$t('select_date_range')"
                >
                    <template #footer>
                        <Divider class="my-2!" />
                        <div class="flex justify-between">
                            <Button class="text-base!" variant="text" size="small" @click="dateRange = [new Date(), null]">
                                {{ $t('today') }}
                            </Button>

                            <Button class="text-base!" variant="text" size="small" @click="dateRange = null">
                                {{ $t('reset') }}
                            </Button>
                        </div>
                    </template>
                </DatePicker>

                <Button 
                    severity="secondary" 
                    class="bg-white! border-slate-300! hover:bg-slate-100!"
                    :disabled="loading || loadingNumbers"
                    :loading="loading || loadingNumbers"
                    @click="openFilterMenu"
                >
                    <div v-if="!selectedFilter" class="flex items-center gap-2">
                        <IconFilter size="14" />
                        <span>{{ $t('filter') }}</span>
                        
                    </div>
                    <div v-else class="flex items-center gap-2">
                        <component :is="selectedFilter.iconEl" size="14" :class="selectedFilter.iconClass" />
                        <span>{{ selectedFilter.label }}</span>
                        <IconX @click.stop="selectedFilter = undefined" size="12" class="ml-1" />
                    </div>
                </Button>
            </div>
        </div>

        <Menu :model="filterOptions" :popup="true" ref="filterMenu">
            <template #item="{ item, props }">
                <div v-ripple v-bind="props.action" @click="setFilter(item)" class="flex items-center gap-3">
                    <component v-if="item.iconEl" :is="item.iconEl" :class="item.iconClass" size="16" />
                    <span>{{ item.label }}</span>
                </div>
            </template>
        </Menu>

        <BroadcastTable
            :dataPage="dataPage"
            :loading="loading"
            :rowsPerPage="rowsPerPage"
            :currentPageReport="currentPageReport"
            @update:rowsPerPage="(val: number) => rowsPerPage = val"
            :fetchData="() => fetchDataPage(1, rowsPerPage)"
            :onPage="onPage"
        />
    </div>
</template>