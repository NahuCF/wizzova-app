<script setup lang="ts">
import type { DataTablePageEvent } from 'primevue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { IconArrowLeft, IconDownload } from '@tabler/icons-vue'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useRelativeDateLabel } from '~/composables/useRelativeDateLabel'
import { API } from '~/services'
import type { ContactImportItem } from '~/types'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const formatDate = useRelativeDateLabel()

const {
    dataPage,
    loading,
    rowsPerPage,
    currentPageReport,
    fetchDataPage
} = usePaginatedData<ContactImportItem>(
    (page, perPage) => API.contact.importHistory(page, perPage).then(res => res.data),
    10
)

const showImportContacts = ref(false)
const columns = [
    { header: 'name', key: 'name' },
    { header: 'imported_on', key: 'createdAtFormatted' },
    { header: 'import_type', key: 'importTypeFormatted' },
    { header: 'total_contacts', key: 'total_contacts_count' },
    { header: 'updated_contacts', key: 'addedContactsCount' },
    { header: 'errored_contacts', key: 'errorContactsCount' },
    { header: 'status', key: 'status' }
]

const transformedData = computed(() => {
    return dataPage.value.data.map(item => ({
        ...item,
        importTypeFormatted: t(`contact_import_type.${item.import_type}`),
        createdAtFormatted: formatDate(item.created_at, item.user.name),
        addedContactsCount: {
            count: item.added_contacts_count,
            percentage: item.total_contacts_count > 0
                ? Math.round((item.added_contacts_count / item.total_contacts_count) * 100)
                : 0,
        },
        errorContactsCount: {
            count: item.error_contacts_count,
            percentage: item.total_contacts_count > 0
                ? Math.round((item.error_contacts_count / item.total_contacts_count) * 100)
                : 0,
        }
    }))
})

const onPage = (event: DataTablePageEvent) => {
	rowsPerPage.value = event.rows
	const page = Math.floor(event.first / event.rows) + 1
	fetchDataPage(page, rowsPerPage.value)
}

const statusToSeverity = (status: string) => {
    switch (status) {
        case 'COMPLETED':
            return 'success'
        case 'PENDING':
            return 'warn'
        case 'FAILED':
            return 'danger'
        default:
            return 'info'
    }
}

watch(rowsPerPage, 
    () => fetchDataPage(1, rowsPerPage.value), 
    { immediate: true }
)

let intervalId: ReturnType<typeof setInterval>
let isPolling = false

onMounted(() => {
    intervalId = setInterval(async () => {
        if (isPolling) return
        isPolling = true

        try {
            await Promise.all(
                dataPage.value.data.map(async (contactImport, index) => {
                    if (contactImport.status === 'PENDING' || contactImport.status === 'PROCESSING') {
                        try {
                            const { data: response } = await API.contact.pollImportStatus(contactImport.id)
                            dataPage.value.data[index] = {
                                ...dataPage.value.data[index],
                                ...response.data
                            }
                        } catch (error) {
                            console.log(error)
                        }
                    }
                })
            )
        } finally {
            isPolling = false
        }
    }, 5000)
})

onUnmounted(() => {
    clearInterval(intervalId)
})
</script>

<template>
    <div class="flex flex-col gap-6 h-full p-6">
        <div class="flex justify-between">
			<div class="flex items-center">
                <Button variant="text" @click="router.push({ name: 'contacts' })" size="small" severity="secondary">
                    <IconArrowLeft size="18" />
                </Button>
                <h1 class="font-semibold text-lg">{{ $t('contact_imports.title') }}</h1>
            </div>
			<Button @click="showImportContacts = true">
                <IconDownload size="16" class="mr-1" />
				<span class="text-sm">
					{{ $t('import') }}
				</span>
			</Button>
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
                        {{ $t('contact_imports.empty') }}
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
                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`contact_imports.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }">
                        <template v-if="column.header === 'imported_on'">
                            <div class="flex">
                                <span v-tooltip="data[column.key].tooltip.date"
                                    v-tooltip.bottom="{
                                        value: `${$t('imported_by', { author: data[column.key].tooltip.author })}\n${$t('imported_at', { date: data[column.key].tooltip.date })}`,
                                        class: 'text-sm max-w-full!'
                                    }"
                                    class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm"
                                >
                                    {{ data[column.key].label }}
                                </span>
                            </div>
                        </template>

                        <Tag 
                            v-else-if="column.header === 'status'" 
                            :value="$t(`contact_imports.status.${data[column.key]}`)"
                            :severity="statusToSeverity(data[column.key])"
                            size="small"
                        />

                        <template
                            v-else-if="column.header === 'updated_contacts' || column.header === 'errored_contacts'">
                            <div class="flex gap-2 items-center">
                                <CircularProgress :progress="data[column.key].percentage" />
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

            <ImportContactDialog
                v-model:visible="showImportContacts"
                @success="fetchDataPage(1, rowsPerPage)"
            />
        </div>
    </div>
</template>