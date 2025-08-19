<script setup lang="ts">
import type { DataTablePageEvent } from 'primevue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { IconArrowLeft, IconDownload } from '@tabler/icons-vue'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useRelativeDateLabel } from '~/composables/useRelativeDateLabel'
import { API } from '~/services'
import type { Column, ContactImportItem } from '~/types'
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
const columns: Column[] = [
    { header: t('contact_imports.headers.name'), key: 'name' },
    { header: t('contact_imports.headers.imported_on'), key: 'createdAtFormatted', type: 'CUSTOM' },
    { header: t('contact_imports.headers.import_type'), key: 'importTypeFormatted' },
    { header: t('contact_imports.headers.total_contacts'), key: 'total_contacts_count' },
    { header: t('contact_imports.headers.updated_contacts'), key: 'addedContactsCount', type: 'PROGRESS' },
    { header: t('contact_imports.headers.errored_contacts'), key: 'errorContactsCount', type: 'PROGRESS' },
    { header: t('contact_imports.headers.status'), key: 'statusTag', type: 'TAG' }
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
        },
        statusTag: {
            label: t(`contact_imports.status.${item.status}`),
            severity: statusToSeverity(item.status)
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
                    <IconArrowLeft size="22" />
                </Button>
                <h1 class="font-semibold text-2xl">{{ $t('contact_imports.title') }}</h1>
            </div>
			<Button @click="showImportContacts = true">
                <IconDownload size="16" class="mr-1" />
				<span>
					{{ $t('import') }}
				</span>
			</Button>
		</div>

        <Table 
            :data="transformedData"
            :columns="columns"
            emptyMessage="contact_imports.empty"
            :loading="loading"
            withPagination
            :totalRecords="dataPage.meta.total"
            v-model:rowsPerPage="rowsPerPage"
            :currentPageReport="currentPageReport"
            @onPage="onPage"
        >
            <template #createdAtFormatted="{ data }">
                <div class="flex">
                    <span
                        v-tooltip.bottom="{
                            value: `${
                                $t('imported_by', { author: data['createdAtFormatted'].tooltip.author })}\n${$t('imported_at', { date: data['createdAtFormatted'].tooltip.date })
                            }`,
                            class: 'text-base max-w-full!'
                        }"
                        class="block whitespace-nowrap overflow-hidden text-ellipsis text-base"
                    >
                        {{ data['createdAtFormatted'].label }}
                    </span>
                </div>
            </template>
        </Table>
            
        <ImportContactDialog
            v-model:visible="showImportContacts"
            @success="fetchDataPage(1, rowsPerPage)"
        />
    </div>
</template>