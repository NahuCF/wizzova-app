<script setup lang="ts">
import { IconTrash, IconDotsVertical } from '@tabler/icons-vue'
import type { DataTablePageEvent } from 'primevue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore } from '~/stores'
import type { ContactFieldItem, ContactItem, Filter, Page } from '~/types'

const props = defineProps<{
    loading: boolean,
    dataPage: Page<ContactItem>,
    rowsPerPage: number,
    currentPageReport: string
    filters: Filter[],
    readonly?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:rowsPerPage', rowsPerPage: number): void,
    (e: 'load-page', pageNumber: number): void,
    (e: 'update-contact', contactItem: ContactItem): void, 
    (e: 'delete-contact', contactItem: ContactItem): void, 
}>()

const { t } = useI18n()
const contactFieldStore = useContactFieldStore()

const contactOptions = ref([
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (contactItem: ContactItem) => {
                emit('delete-contact', contactItem)
            }
		}
	]
])
const contactMenu = ref()

const onPage = (event: DataTablePageEvent) => {
	if(props.rowsPerPage !== event.rows) {
        emit('update:rowsPerPage', event.rows)
    }
    else {
        const page = Math.floor(event.first / event.rows) + 1
        emit('load-page', page)
    }
}

const getContactField = (contactFieldItem: ContactFieldItem, contact: ContactItem) => {
    return contact.fields.find(f => f.name === contactFieldItem.name)
}

const formatField = (contactFieldItem: ContactFieldItem, contact: ContactItem) => {
    const contactField = getContactField(contactFieldItem, contact)

    if(!contactField) {
        const header = t(`contacts.headers.${contactFieldItem.name}`, { default: contactFieldItem.name })
        return `No ${header}`
    }

    if(Array.isArray(contactField.value)) {
        return contactField.value.join(', ')
    } 
    else if (typeof contactField.value === 'boolean') {
        return Boolean(contactField.value) ? t('yes') : t('no')
    }
    else {
        return contactField.value
    }
}

const onEditContact = ({ data }: { data: ContactItem }) => {
    emit('update-contact', data)
}
</script>

<template>
    <div class="overflow-auto">
        <DataTable 
            :value="dataPage.data" 
            dataKey="id" 
            class="rounded-lg overflow-hidden" 
            :lazy="true" 
            :paginator="true"
            :loading="loading || contactFieldStore.loading" 
            :rows="rowsPerPage" 
            :totalRecords="dataPage.meta.total"
            scrollable 
            scrollHeight="flex"
            paginatorTemplate="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
            :currentPageReportTemplate="currentPageReport" 
            :rowHover="!readonly" 
            :rowClass="() => readonly ? '' : 'cursor-pointer'" 
            @page="onPage"
            @row-click="(props) => readonly ? {} : onEditContact(props)"
        >
            <template #empty>
                <div class="text-center text-sm py-4 text-gray-500">
                    {{ $t('contacts.empty') }}
                </div>
            </template>

            <template #paginatorstart>
                <div class="flex items-center gap-2">
                    <label for="rows" class="text-sm font-bold!">
                        {{ $t('show_rows_per_page') }}
                    </label>
                    <Select 
                        id="rows" 
                        :model-value="rowsPerPage" 
                        @change="(value) => emit('update:rowsPerPage', value.value)" 
                        :options="[10, 20, 50]" 
                        size="small" 
                    />
                </div>
            </template>

            <Column 
                v-for="cf in contactFieldStore.primaryFields" 
                :key="cf.id" 
                :bodyStyle="{ maxWidth: '100px', ...(readonly && { height: '50px' }) }" 
                headerClass="bg-slate-200!" 
            >
                <template #header>
                    <div class="uppercase text-sm font-semibold">
                        {{ $te(`contacts.headers.${cf.name}`) ? $t(`contacts.headers.${cf.name}`) :  cf.name }}
                    </div>
                </template>

                <template #body="{ data }: { data: ContactItem }">
                    <span 
                        class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm"
                        :class="{ 'opacity-25': getContactField(cf, data)?.value === undefined }"
                        v-tooltip.bottom="
                            Array.isArray(getContactField(cf, data)?.value) 
                                ? {
                                    value: (getContactField(cf, data)?.value as string[]).join('\n'),
                                    class: 'text-sm max-w-[300px]!'
                                } 
                                : undefined
                        "
                    >
                        {{ formatField(cf, data) }}
                    </span>
                </template>
            </Column>

            <Column v-if="!readonly" headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                <template #body="{ data }: { data: ContactItem }">
                    <div class="flex justify-center">
                        <Button severity="secondary" variant="text" @click="(e: Event) => contactMenu?.show(e, data)">
                            <IconDotsVertical size="13" />
                        </Button>
                    </div>
                </template>
            </Column>
        </DataTable>

        <ActionsPopover ref="contactMenu" :options="contactOptions" />
    </div>
</template>