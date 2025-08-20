<script setup lang="ts">
import { IconRefresh, IconPlus, IconUsers, IconCheck, IconChecks, 
    IconExclamationCircle, IconArrowBackUp, IconSearch } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { BroadcastNumber, BroadcastItem, BroadcastOverview, BroadcastStatus, Column } from '~/types'

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
    (page, perPage, search) => API.broadcast.index(page, perPage, search).then(res => res.data),
    10
)

const columns: Column[] = [
    { header: t('broadcasts.headers.name'), key: 'name' },
    { header: t('broadcasts.headers.created_at'), key: 'createdAtFormatted' },
    { header: t('broadcasts.headers.created_by'), key:'createdByFormatted' },
    { header: t('broadcasts.headers.recipients'), key: 'recipients_count' },
    { header: t('broadcasts.headers.sent'), key: 'sentCount', type: 'PROGRESS' },
    { header: t('broadcasts.headers.received'), key: 'receivedCount', type: 'PROGRESS' },
    { header: t('broadcasts.headers.read'), key: 'readCount', type: 'PROGRESS' },
    { header: t('broadcasts.headers.failed'), key: 'failedCount', type: 'PROGRESS' },
    { header: t('broadcasts.headers.status'), key: 'statusTag', type: 'TAG' }
]
const loadingNumbers = ref(false)
const loadingOverview = ref(false)
const canRefresh = ref(true)
const broadcastNumbers = ref<BroadcastNumber[]>([])
const selectedNumber = ref<BroadcastNumber>()
const overviewData = ref<BroadcastOverview>({
    recipients: 0,
    sent: { count: 0, percentage: 0 },
    received: { count: 0, percentage: 0 },
    read: { count: 0, percentage: 0 },
    responded: { count: 0, percentage: 0 },
    failed: { count: 0, percentage: 0 }
})

const transformedData = computed(() => {
    return dataPage.value.data.map(item => ({
        ...item,
        createdAtFormatted: moment(item.created_at).format('DD/MM/YYYY'),
        createdByFormatted: item.user.name,
        sentCount: {
            count: item.sent_count,
            percentage: item.recipients_count > 0
                ? Math.round((item.sent_count / item.recipients_count) * 100)
                : 0,
            color: 'stroke-gray-500'
        },
        receivedCount: {
            count: item.received_count,
            percentage: item.recipients_count > 0
                ? Math.round((item.received_count / item.recipients_count) * 100)
                : 0,
            color: 'stroke-neutral-900'
        },
        readCount: {
            count: item.read_count,
            percentage: item.recipients_count > 0
                ? Math.round((item.read_count / item.recipients_count) * 100)
                : 0,
            color: 'stroke-sky-600'
        },
        failedCount: {
            count: item.failed_count,
            percentage: item.recipients_count > 0
                ? Math.round((item.failed_count / item.recipients_count) * 100)
                : 0,
            color: 'stroke-red-600'
        },
        statusTag: {
            label: t(`broadcasts.status.${item.status}`),
            severity: statusToSeverity(item.status)
        }
    }))
})

const overviewCards = computed(() => [
    {
        key: 'recipients',
        label: t('broadcasts.headers.recipients'),
        icon: IconUsers,
        colorClass: '',
        count: overviewData.value.recipients
    },
    {
        key: 'sent',
        label: t('broadcasts.headers.sent'),
        icon: IconCheck,
        colorClass: 'text-gray-500',
        count: overviewData.value.sent.count,
        percentage: overviewData.value.sent.percentage
    },
    {
        key: 'received',
        label: t('broadcasts.headers.received'),
        icon: IconChecks,
        colorClass: 'text-neutral-900',
        count: overviewData.value.received.count,
        percentage: overviewData.value.received.percentage
    },
    {
        key: 'read',
        label: t('broadcasts.headers.read'),
        icon: IconChecks,
        colorClass: 'text-sky-600',
        count: overviewData.value.read.count,
        percentage: overviewData.value.read.percentage
    },
    {
        key: 'replied',
        label: t('broadcasts.headers.replied'),
        icon: IconArrowBackUp,
        colorClass: 'text-emerald-500',
        count: overviewData.value.responded.count,
        percentage: overviewData.value.responded.percentage
    },
    {
        key: 'failed',
        label: t('broadcasts.headers.failed'),
        icon: IconExclamationCircle,
        colorClass: 'text-red-600',
        count: overviewData.value.failed.count,
        percentage: overviewData.value.failed.percentage
    }
])

const statusToSeverity = (status: BroadcastStatus) => {
    switch (status) {
        case 'COMPLETED':
            return 'success'
        case 'PROCESSING':
            return 'warn'
        case 'SCHEDULED':
            return 'info'
    }
}

const fetchBroadcastNumbers = async () => {
    loadingNumbers.value = true
    try {
        const { data: response } = await API.broadcast.broadcastNumbers()
        broadcastNumbers.value = response

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
    loadingOverview.value = true
    try {
        const { data: response } = await API.broadcast.overview()
        overviewData.value = response
    } catch(error) {
        console.log(error)
    } finally {
        loadingOverview.value = false
    }
}

const refreshData = () => {
    if (!canRefresh.value) return

    canRefresh.value = false

    fetchDataPage(1, rowsPerPage.value)
    fetchBroadcastNumbers()
    fetchOverview()

    setTimeout(() => {
        canRefresh.value = true
    }, 3000)
}

watch(rowsPerPage, 
    () => fetchDataPage(1, rowsPerPage.value), 
    { immediate: true }
)

fetchBroadcastNumbers()
fetchOverview()
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
                    @click="refreshData"
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
                    option-label="name"
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
            <div class="text-lg font-bold text-gray-500">{{ $t('broadcasts.overview') }}</div>
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
        </div>

        <Table 
            :data="transformedData"
            :columns="columns"
            emptyMessage="broadcasts.empty"
            :loading="loading"
            withPagination
            :totalRecords="dataPage.meta.total"
            v-model:rowsPerPage="rowsPerPage"
            :currentPageReport="currentPageReport"
            @onPage="onPage"
        />
    </div>
</template>