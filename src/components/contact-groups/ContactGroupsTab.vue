<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconSearch, IconPlus, IconTrash, IconEdit } from '@tabler/icons-vue'
import moment from 'moment'
import { useCrudActions } from '~/composables/useCrudActions'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { Column, ContactGroupItem, CreateContactGroup, FilterCondition } from '~/types'
import type { DataTablePageEvent } from 'primevue'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore } from '~/stores'

const props = defineProps<{
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
const columns = ref<Column[]>([
    {
        header: t('contact_groups.headers.name_of_group'),
        key: 'name',
    },
    {
        header: t('contact_groups.headers.filters'),
        key: 'filterTags',
        type: 'TAG_LIST'
    },
    {
        header: t('contact_groups.headers.total_contacts'),
        key: 'contact_count'
    },
    {
        header: t('contact_groups.headers.created_by'),
        key: 'created_by'
    },
    {
        header: t('contact_groups.headers.last_update'),
        key: 'last_update'
    },
    {
        header: '',
        key: 'actions',
        type: 'ACTIONS'
    }
])

const transformedData = computed(() => {
    return dataPage.value.data.map(item => ({
        ...item,
        created_by: item.user.name,
        last_update: moment(item.updated_at).format('YYYY-MM-DD'),
        filterTags: item.filters.map(condition => formatCondition(condition.contact_field_id, condition)),
        actions: groupActions
    }))
})

const onCreateGroup = (contactGroup?: ContactGroupItem) => {
    selectedGroup.value = contactGroup
    showGroupDialog.value = true
}

const groupActions = (contactGroup: ContactGroupItem) => [
    [
		{
			label: t('contact_groups.edit'),
			icon: IconEdit,
			action: () => onCreateGroup(contactGroup)
		}
	],
	[
		{
			label: t('delete'),
			class: 'text-red-600',
			icon: IconTrash,
			action: () => {
                selectedGroup.value = contactGroup
                showDeleteDialog.value = true
            }
		}
	]
]

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

const onRowSelect = ({ data: group }: { data: ContactGroupItem }) => {
    if(!props.selectedGroups) return

    if(props.selectedGroups.find(g => g.id === group.id)) {
        emit('update:selectedGroups', props.selectedGroups.filter(g => g.id !== group.id))
    }
    else {
        emit('update:selectedGroups', [
            ...props.selectedGroups,
            group
        ])
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
        <div class="flex justify-between py-2">
            <div class="relative">
                <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
            <Button @click="onCreateGroup()">
                <IconPlus size="16" class="mr-1" />
                <span>
                    {{ $t('contact_groups.add_group') }}
                </span>
            </Button>
        </div>

        <Table 
            :data="transformedData"
            :columns="columns"
            :selection="selectedGroups"
            :hoverable="!!selectedGroups"
            @update:selection="(groups: ContactGroupItem[]) => emit('update:selectedGroups', groups)"
            @onRowClick="onRowSelect"
            emptyMessage="contact_groups.empty"
            :loading="loading"
            withPagination
            :totalRecords="dataPage.meta.total"
            v-model:rowsPerPage="rowsPerPage"
            :currentPageReport="currentPageReport"
            @onPage="onPage"
        />

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
</template>

<style lang="css" scoped>
:deep(.p-datatable-paginator-bottom) {
    border: none;
}
</style>