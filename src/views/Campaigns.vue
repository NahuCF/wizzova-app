<script setup lang="ts">
import { IconRefresh, IconPlus, IconUsers, IconCheck, IconChecks, 
    IconExclamationCircle, IconArrowBackUp, IconSearch } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { BroadcastNumber, CampaignItem, CampaignOverview, CampaignStatus } from '~/types'

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
} = usePaginatedData<CampaignItem>(
    (page, perPage, search) => API.campaign.index(page, perPage, search).then(res => res.data),
    10
)

const columns = [
    { header: 'name', key: 'name' },
    { header: 'created_at', key: 'createdAtFormatted' },
    { header: 'created_by', key:'createdByFormatted' },
    { header: 'recipients', key: 'recipients_count' },
    { header: 'sent', key: 'sentCount' },
    { header: 'received', key: 'receivedCount' },
    { header: 'read', key: 'readCount' },
    { header: 'failed', key: 'failedCount' },
    { header: 'status', key: 'status' }
]
const loadingNumbers = ref(false)
const loadingOverview = ref(false)
const canRefresh = ref(true)
const broadcastNumbers = ref<BroadcastNumber[]>([])
const selectedNumber = ref<BroadcastNumber>()
const overviewData = ref<CampaignOverview>({
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
        }
    }))
})

const overviewCards = computed(() => [
    {
        key: 'recipients',
        label: t('campaigns.headers.recipients'),
        icon: IconUsers,
        colorClass: '',
        count: overviewData.value.recipients
    },
    {
        key: 'sent',
        label: t('campaigns.headers.sent'),
        icon: IconCheck,
        colorClass: 'text-gray-500',
        count: overviewData.value.sent.count,
        percentage: overviewData.value.sent.percentage
    },
    {
        key: 'received',
        label: t('campaigns.headers.received'),
        icon: IconChecks,
        colorClass: 'text-neutral-900',
        count: overviewData.value.received.count,
        percentage: overviewData.value.received.percentage
    },
    {
        key: 'read',
        label: t('campaigns.headers.read'),
        icon: IconChecks,
        colorClass: 'text-sky-600',
        count: overviewData.value.read.count,
        percentage: overviewData.value.read.percentage
    },
    {
        key: 'replied',
        label: t('campaigns.headers.replied'),
        icon: IconArrowBackUp,
        colorClass: 'text-emerald-500',
        count: overviewData.value.responded.count,
        percentage: overviewData.value.responded.percentage
    },
    {
        key: 'failed',
        label: t('campaigns.headers.failed'),
        icon: IconExclamationCircle,
        colorClass: 'text-red-600',
        count: overviewData.value.failed.count,
        percentage: overviewData.value.failed.percentage
    }
])

const statusToSeverity = (status: CampaignStatus) => {
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
        const { data: response } = await API.campaign.broadcastNumbers()
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
        const { data: response } = await API.campaign.overview()
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
                <h1 class="font-semibold text-xl">{{ $t('campaigns.title') }}</h1>
            </div>
            <div class="flex justify-between gap-2">
                <Button 
                    class="bg-white! border-slate-200! hover:bg-slate-100!" 
                    size="small" 
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
                    size="small"
                    :placeholder="$t('campaigns.select_number')"
                    :loading="loadingNumbers"
                    :disabled="loadingNumbers"
                />

                <Button @click="router.push({ name: 'new-campaign' })">
                    <IconPlus size="16" class="mr-1" />
                    <span class="text-sm">
                        {{ $t('campaigns.new_campaign') }}
                    </span>
                </Button>
            </div>
        </div>

        <div class="flex flex-col gap-5 p-6 bg-slate-200 rounded-lg border border-gray-300">
            <div class="text-lg font-bold text-gray-500">{{ $t('campaigns.overview') }}</div>
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
            <div class="font-semibold text-lg">{{ $t('campaigns.all_campaigns') }}</div>
            <div class="relative">
                <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <InputText
                    v-model="searchTerm"
                    class="pl-8! max-w-[180px] text-sm! shadow-none!"
                    name="search"
                    id="search"
                    fluid
                    :placeholder="$t('search')"
                    @input="debouncedFetch()"
                />
            </div>
        </div>

        <div class="overflow-auto">
            <DataTable 
                :value="transformedData" 
                dataKey="id" 
                class="rounded-lg overflow-hidden" 
                :lazy="true"
                :paginator="true" 
                :loading="loading" 
                :rows="rowsPerPage" 
                :totalRecords="dataPage.meta.total" 
                scrollable
                scrollHeight="flex"
                paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                :currentPageReportTemplate="currentPageReport"
                @page="onPage"
            >
                <template #empty>
                    <div class="text-center text-sm py-4 text-gray-500">
                        {{ $t('campaigns.empty') }}
                    </div>
                </template>

                <template #paginatorstart>
                    <div class="flex items-center gap-2">
                        <label for="rows" class="text-sm font-bold!">
                            {{ $t('show_rows_per_page') }}
                        </label>
                        <Select id="rows" v-model="rowsPerPage" :options="[10, 20, 50]" size="small" />
                    </div>
                </template>

                <Column v-for="column in columns" :key="column.header" headerClass="bg-slate-200!">
                    <template #loading>
                        <div class="flex items-center"
                            :style="{ height: '17px', 'flex-grow': '1', overflow: 'hidden' }">
                            <Skeleton width="40%" height="1rem" />
                        </div>
                    </template>

                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`campaigns.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }">
                        <Tag v-if="column.header === 'status'" :value="$t(`campaigns.status.${data[column.key]}`)"
                            :severity="statusToSeverity(data[column.key])" size="small" />

                        <template v-else-if="data[column.key].percentage">
                            <div class="flex gap-2 items-center">
                                <CircularProgress :progress="data[column.key].percentage" :color="data[column.key].color" />
                                <div class="flex flex-col gap-0.5 text-sm">
                                    <span>{{ data[column.key].count }}</span>
                                    <span class="text-gray-500">
                                        {{ data[column.key].percentage }}%
                                    </span>
                                </div>
                            </div>
                        </template>

                        <span v-else class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                            {{ data[column.key] }}
                        </span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>