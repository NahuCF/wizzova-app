<script setup lang="ts">
import axios from 'axios'
import { useToast, type DataTablePageEvent } from 'primevue'
import { computed, ref, watch, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useContactFieldStore, useUserStore } from '~/stores'
import type { Column, ContactFieldItem, ContactFieldType, ContactItem, CreateContact, Filter, FilterOperator } from '~/types'
import { 
    IconCircleDot, IconHash, IconTypography, IconTextWrap, IconUserCircle, 
    IconToggleLeft, IconCalendar, IconSearch, IconPlus, IconDownload,  
    IconDotsVertical, IconTrash, IconX
} from '@tabler/icons-vue'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const contactFieldStore = useContactFieldStore()
const userStore = useUserStore()
const {
  dataPage,
  loading,
  searchTerm,
  rowsPerPage,
  fetchDataPage,
  debouncedFetch,
} = usePaginatedData<ContactItem>(
    (page, perPage, search) => API.contact.index(page, perPage, search, transformFilters()).then(res => res.data),
    10
)

const importMenu = ref()
const contactMenu = ref()
const selectedContact = ref<ContactItem | undefined>()
const showDeleteDialog = ref(false)
const showContactDrawer = ref(false)
const showImportContacts = ref(false)
const loadingDrawer = ref(false)
const filters = ref<Filter[]>([])

const contactOptions = ref([
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (contactItem: ContactItem) => {
                selectedContact.value = contactItem
                showDeleteDialog.value = true
            }
		}
	]
])
const importOptions = ref([
    {
        label: t('contacts.import_file'),
        action: () => showImportContacts.value = true
    },
    {
        label: t('contacts.import_history'),
        action: () => router.push('/contacts/import/history')
    }
])

const operatorsByType: Record<ContactFieldType, FilterOperator[]> = {
    TEXT: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    MULTI_TEXT: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    SELECT: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    SWITCH: ['is', 'is_not', 'is_empty', 'is_not_empty'],
    USER: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
    DATE: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
    NUMBER: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
}

const iconsByType: Record<ContactFieldType, Component> = {
    SELECT: IconCircleDot,
    NUMBER: IconHash,
    TEXT: IconTypography,
    MULTI_TEXT: IconTextWrap,
    USER: IconUserCircle,
    SWITCH: IconToggleLeft,
    DATE: IconCalendar
}

const columns = computed<Column[]>(() => {
    return contactFieldStore.contactFields
        .map(field => {
            let options: { label: string; value: any }[] | undefined

            if (field.type === 'USER') {
                options = userStore.users.map(user => ({
                    label: user.name,
                    value: user.id
                }))
            } else if (field.options && field.options.length) {
                options = field.options.map(opt => ({ label: opt, value: opt }))
            } else if (field.type === 'SWITCH') {
                options = [
                    { label: t('yes'), value: true },
                    { label: t('no'), value: false }
                ]
            }

            return {
                id: field.id,
                name: field.name,
                type: field.type.toLowerCase(),
                operators: operatorsByType[field.type] || ['contains', 'is', 'is_not'],
                icon: iconsByType[field.type] || null,
                options
            }
        })
})

const toggleImportMenu = (event: Event) => {
    importMenu.value.toggle(event)
}

const currentPageReport = computed(() => {
	const total = dataPage.value.meta.total
	const first = (dataPage.value.meta.current_page - 1) * rowsPerPage.value + (total > 0 ? 1 : 0)
	let last = first + rowsPerPage.value - 1
	if (last > dataPage.value.meta.total) last = dataPage.value.meta.total
	
	return t('showing_results', {
		first: first,
		last: last
	})
})

const onPage = (event: DataTablePageEvent) => {
	rowsPerPage.value = event.rows
	const page = Math.floor(event.first / event.rows) + 1
	fetchDataPage(page, rowsPerPage.value)
}

const onRowClick = ({ data }: { data?: ContactItem }) => {
    selectedContact.value = data
    showContactDrawer.value = true
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

const formatCondition = (contactFieldId: string, condition: { operator: FilterOperator | ''; value: string[]; labels?: string[] }) => {
    const field = contactFieldStore.contactFields.find(f => f.id === contactFieldId)
    const opLabel = t(`filters.operators.${condition.operator}`) || condition.operator

    const displayValues = condition.labels && condition.labels.length === condition.value.length
        ? condition.labels
        : condition.value

    const valStr = displayValues?.join(', ') || ''
    return `${field?.name || ''} ${opLabel}${valStr ? ': ' + valStr : ''}`
}

const removeFromFilter = (filterIndex: number, conditionIndex: number) => {
    if (filterIndex < 0 || filterIndex >= filters.value.length) return

    const filter = filters.value[filterIndex]
    if (!filter) return

    filter.conditions.splice(conditionIndex, 1)

    if (filter.conditions.length === 0) {
        filters.value.splice(filterIndex, 1)
    }
}

const onFiltersUpdate = (newFilters: Filter[]) => {
    filters.value = newFilters
}

const transformFilters = () => {
    return filters.value.flatMap(filter =>
        filter.conditions.map(condition => ({
            contact_field_id: filter.columnId,
            operator: condition.operator,
            value: condition.value
        }))
    )
}

const createContact = async (contact: CreateContact) => {
    loadingDrawer.value = true
    try {
        let message = ''

        if(contact.id) {
            await API.contact.update(contact)
            message = t('contacts.contact_updated')
        }
        else {
            await API.contact.create(contact)
            message = t('contacts.contact_created')
        }

        fetchDataPage(1, rowsPerPage.value)

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: message,
            life: 3000,
        })
        
        showContactDrawer.value = false
    } catch(error) {
        let errorMessage = t('an_error_occurred')

        if (axios.isAxiosError(error) && error.status === 422 && error.response) {
            errorMessage = t('validation_errors.' + error.response.data.message.replace('.', ''))
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage,
            life: 3000,
        })
    } finally {
        loadingDrawer.value = false
    }
}

const deleteContact = async () => {
    try {
        const id = selectedContact.value?.id ?? ''
        await API.contact.delete(id)

        dataPage.value.data = dataPage.value.data.filter(cf => cf.id !== id)
        dataPage.value.meta.total = dataPage.value.meta.total - 1
        showDeleteDialog.value = false

        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: t('contacts.contact_deleted'),
            life: 3000,
        })
    } catch(error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: t('an_error_occurred'),
            life: 3000,
        })
    }
}

watch(rowsPerPage, 
    () => fetchDataPage(1, rowsPerPage.value), 
    { immediate: true }
)

watch(filters, 
    () => fetchDataPage(1, rowsPerPage.value), 
    { deep: true }
)

contactFieldStore.fetchContactFields()
userStore.fetchUsers()
</script>

<template>
    <div class="flex flex-col gap-6 h-full">
        <div class="flex justify-between py-2.5">
            <div class="flex gap-2">
                <GenericFilters 
                    :columns="columns" 
                    :modelValue="filters"
                    @update:filters="onFiltersUpdate" 
                />
                <Button
                    class="bg-white! border-slate-200! hover:bg-slate-100!" 
                    severity="secondary" 
                    aria-haspopup="true" 
                    aria-controls="overlay_menu"
                    @click="toggleImportMenu" 
                >
                    <IconDownload size="14" />
                    <span class="text-sm">
                        {{ $t('import') }}
                    </span>
                </Button>
                <Menu ref="importMenu" id="overlay_menu" :model="importOptions" :popup="true">
                    <template #item="{ item, props }">
                        <div v-ripple v-bind="props.action" @click="item.action">
                            <span class="text-sm">{{ item.label }}</span>
                        </div>
                    </template>
                </Menu>
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
            <Button @click="onRowClick({})">
                <IconPlus size="16" class="mr-1" />
                <span class="text-sm">
                    {{ $t('contacts.add_contact') }}
                </span>
            </Button>
        </div>

        <div v-if="filters.length > 0" class="flex flex-wrap gap-2">
            <template v-for="(filter, fIndex) in filters" :key="fIndex">
                <template v-for="(condition, cIndex) in filter.conditions" :key="cIndex">
                    <Tag class="px-3!" rounded size="small">
                        {{ formatCondition(filter.columnId, condition) }}
                        <Button 
                            variant="text" 
                            rounded
                            class="p-0.5!"
                            size="small"
                            @click="removeFromFilter(fIndex, cIndex)"
                        >
                            <IconX class="w-4 h-4" />
                        </Button>
                    </Tag>
                </template>
            </template>
        </div>
        
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
                rowHover
                :rowClass="() => 'cursor-pointer'"
                @page="onPage"
                @row-click="onRowClick"
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
                            v-model="rowsPerPage"
                            :options="[10, 20, 50]"
                            size="small"
                        />
                    </div>
                </template>

                <Column v-for="cf in contactFieldStore.primaryFields" :key="cf.id" :bodyStyle="{ maxWidth: '100px' }" headerClass="bg-slate-200!" >
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

                <Column headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                    <template #body="{ data }: { data: ContactItem }">
                        <div class="flex justify-center">
                            <Button severity="secondary" variant="text" @click="(e: Event) => contactMenu?.show(e, data)">
                                <IconDotsVertical  size="13" />
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <ActionsPopover ref="contactMenu" :options="contactOptions" />
        <DeleteDialog 
            v-model:visible="showDeleteDialog" 
            :title="$t('contacts.delete_contact')"
            :message="$t('contacts.delete_message')"
            @onConfirm="deleteContact" 
        />
        <ContactDrawer 
            v-model:visible="showContactDrawer"
            :fields="contactFieldStore.contactFields"
            :title="selectedContact ? $t('contacts.edit_contact') : $t('contacts.create_contact')"
            :loading="loadingDrawer"
            :contact="selectedContact"
            @onConfirm="createContact"
        />
        <ImportContactDialog
            v-model:visible="showImportContacts"
        />
    </div>
</template>

<style lang="css" scoped>
:deep(.p-paginator-current) {
    font-size: 0.875rem;
}

:deep(.p-datatable-paginator-bottom) {
    border: none;
}
</style>