<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconSearch, IconPlus, IconDotsVertical, IconTrash, IconEdit } from '@tabler/icons-vue'
import moment from 'moment'
import { useCrudActions } from '~/composables/useCrudActions'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { ContactFilterCondition, ContactGroupItem, CreateContactGroup, FilterCondition } from '~/types'
import type { DataTablePageEvent } from 'primevue'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore } from '~/stores'

defineProps<{
    selectedGroups?: ContactGroupItem[]
}>()

const emit = defineEmits<{
    (e: 'update:selectedGroups', selectedGroups: ContactGroupItem[]): void
}>()

const { t } = useI18n()
const contactFieldStore = useContactFieldStore()

const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    currentPageReport,
    fetchDataPage,
    debouncedFetch,
} = usePaginatedData<ContactGroupItem>(
    (page, perPage, search) => API.group.index(page, perPage, search).then(res => res.data),
    10
)

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<CreateContactGroup>({
    api: {
        create: API.group.create,
        update: API.group.update,
        delete: API.group.delete
    },
    fetchData: () => fetchDataPage(1, rowsPerPage.value),
    i18nKeys: {
        created: 'contact_groups.group_created',
        updated: 'contact_groups.group_updated',
        deleted: 'contact_groups.group_deleted'
    }
})

const showGroupDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedGroup = ref<ContactGroupItem>()
const columns = ref([
    {
        header: 'name_of_group',
        value: (data: ContactGroupItem) => data.name
    },
    {
        header: 'filters',
        value: (data: ContactGroupItem) => data.filters
    },
    {
        header: 'total_contacts',
        value: (data: ContactGroupItem) => data.contact_count
    },
    {
        header: 'created_by',
        value: (data: ContactGroupItem) => data.user.name
    },
    {
        header: 'last_update',
        value: (data: ContactGroupItem) => moment(data.updated_at).format('YYYY-MM-DD')
    }
])
const contactMenu = ref()
const filtersPopover = ref()
const hoverFilters = ref<ContactFilterCondition[]>([])
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

const onCreateGroup = (contactGroup?: ContactGroupItem) => {
    selectedGroup.value = contactGroup
    showGroupDialog.value = true
}

const groupOptions = ref([
    [
		{
			label: 'contact_groups.edit',
			icon: IconEdit,
			action: onCreateGroup
		}
	],
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (contactGroup: ContactGroupItem) => {
                selectedGroup.value = contactGroup
                showDeleteDialog.value = true
            }
		}
	]
])

const onPage = (event: DataTablePageEvent) => {
	rowsPerPage.value = event.rows
	const page = Math.floor(event.first / event.rows) + 1
	fetchDataPage(page, rowsPerPage.value)
}

const formatCondition = (contactFieldId: string, condition: FilterCondition) => {
    const field = contactFieldStore.contactFields.find(f => f.id === contactFieldId)
    const opLabel = t(`filters.operators.${condition.operator}`) || condition.operator

    let valStr = condition.value?.join(', ') || ''
    if(field?.type === 'SWITCH') {
        valStr = condition.value?.map(v => Boolean(v) ? t('yes') : t('no')).join(', ') || ''
    }
    
    return `${field?.name || ''} ${opLabel}${valStr ? ': ' + valStr : ''}`
}

const onHover = (event: MouseEvent, filters: ContactFilterCondition[]) => {
    if (hoverTimeout) clearTimeout(hoverTimeout)
    hoverFilters.value = filters
    filtersPopover.value.show(event)
}

const onLeave = () => {
    hoverTimeout = setTimeout(() => {
        filtersPopover.value.hide()
    }, 300)
}

const onSave = (contact: CreateContactGroup) => {
    createOrUpdate(contact, {
        onSuccess: () => showGroupDialog.value = false
    })
}

const onDelete = () => {
    if (selectedGroup.value?.id) {
        remove(selectedGroup.value.id, {
            onSuccess: () => showDeleteDialog.value = false
        })
    }
}

watch(rowsPerPage, 
    () => fetchDataPage(1, rowsPerPage.value), 
    { immediate: true }
)

contactFieldStore.fetchContactFields()
</script>

<template>
    <div class="flex flex-col gap-6 h-full">
        <div class="flex justify-between py-2.5">
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
            <Button @click="onCreateGroup()">
                <IconPlus size="16" class="mr-1" />
                <span class="text-sm">
                    {{ $t('contact_groups.add_group') }}
                </span>
            </Button>
        </div>

        <div class="overflow-auto">
            <DataTable 
                :value="dataPage.data"
                :selection="selectedGroups"
                @update:selection="(groups) => emit('update:selectedGroups', groups)"
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
                        {{ $t('contact_groups.empty') }}
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

                <Column v-if="selectedGroups" selectionMode="multiple" headerStyle="width: 3rem" headerClass="bg-slate-200!"></Column>

                <Column v-for="column in columns" :key="column.header" headerClass="bg-slate-200!">
                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`contact_groups.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }: { data: ContactGroupItem }">
                        <span 
                            v-if="column.header !== 'filters'"
                            class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm"
                        >
                            {{ column.value(data) }}
                        </span>
                        <div v-if="Array.isArray(column.value(data))" class="flex items-center gap-2">
                            <template v-for="(condition, index) in (column.value(data) as ContactFilterCondition[])" :key="index">
                                <Tag v-if="index === 0" class="px-3! text-nowrap" rounded size="small">
                                    {{ formatCondition(condition.contact_field_id, condition) }}
                                </Tag>
                            </template>
                            <div
                                @mouseenter="onHover($event, (column.value(data) as ContactFilterCondition[]))" 
                                @mouseleave="onLeave"    
                            >
                                <Badge 
                                    v-if="(column.value(data) as ContactFilterCondition[]).length > 1" 
                                    severity="secondary"
                                >
                                    +{{ (column.value(data) as ContactFilterCondition[]).length - 1 }}
                                </Badge>
                            </div>
                        </div>
                    </template>
                </Column>

                <Column headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                    <template #body="{ data }: { data: ContactGroupItem }">
                        <div class="flex justify-center">
                            <Button severity="secondary" variant="text" @click="(e: Event) => contactMenu?.show(e, data)">
                                <IconDotsVertical  size="13" />
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>

            <Popover 
                ref="filtersPopover" 
                :showCloseIcon="false" 
                :dismissable="false"
                placement="bottom"
                class="p-2 text-sm shadow-md rounded-md bg-white border"
            >
                <div class="flex flex-col gap-2">
                    <template v-for="(condition, index) in hoverFilters" :key="index">
                        <Tag v-if="index !== 0" class="px-3! text-nowrap" rounded size="small">
                            {{ formatCondition(condition.contact_field_id, condition) }}
                        </Tag>
                    </template>
                </div>
            </Popover>

            <ActionsPopover ref="contactMenu" :options="groupOptions" />
            <ContactGroupDialog
                v-if="showGroupDialog"
                v-model:visible="showGroupDialog"
                :title="selectedGroup ? $t('contact_groups.dialog.edit_group') : $t('contact_groups.dialog.create_group')" 
                :group="selectedGroup"
                :loading="loadingDrawer"
                @confirm="onSave"
            />
            <WarningDialog 
                v-model:visible="showDeleteDialog" 
                :title="$t('contact_groups.delete_group')"
                :message="$t('contact_groups.delete_message')"
                @onConfirm="onDelete" 
            />
        </div>
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