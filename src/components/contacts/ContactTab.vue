<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useContactFieldStore, useUserStore } from '~/stores'
import type { ContactItem, CreateContact, Filter, FilterOperator } from '~/types'
import { IconSearch, IconPlus, IconDownload, IconX } from '@tabler/icons-vue'
import { useCrudActions } from '~/composables/useCrudActions'
import { useContactFilters } from '~/composables/useContactFilters'

const { t } = useI18n()
const router = useRouter()
const contactFieldStore = useContactFieldStore()
const userStore = useUserStore()
const { columns: contactFilters, flattenFilters } = useContactFilters()

const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    currentPageReport,
    fetchDataPage,
    debouncedFetch,
} = usePaginatedData<ContactItem>(
    (page, perPage, search) => API.contact.index(page, perPage, search, flattenFilters(filters.value)).then(res => res.data),
    10
)

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<CreateContact>({
    api: {
        create: API.contact.create,
        update: API.contact.update,
        delete: API.contact.delete
    },
    fetchData: fetchDataPage,
    rowsPerPage,
    i18nKeys: {
        created: 'contacts.contact_created',
        updated: 'contacts.contact_updated',
        deleted: 'contacts.contact_deleted'
    }
})

const importMenu = ref()
const selectedContact = ref<ContactItem | undefined>()
const showDeleteDialog = ref(false)
const showContactDrawer = ref(false)
const showImportContacts = ref(false)
const filters = ref<Filter[]>([])

const importOptions = ref([
    {
        label: t('contacts.import_file'),
        action: () => showImportContacts.value = true
    },
    {
        label: t('contacts.import_history'),
        action: () => router.push({ name: 'contacts-import' })
    }
])

const toggleImportMenu = (event: Event) => {
    importMenu.value.toggle(event)
}

const onCreateContact = (contactItem?: ContactItem) => {
    selectedContact.value = contactItem
    showContactDrawer.value = true
}

const onDeleteContact = (contactItem: ContactItem) => {
    selectedContact.value = contactItem
    showDeleteDialog.value = true
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

const onSave = (contact: CreateContact) => {
    createOrUpdate(contact, {
        onSuccess: () => showContactDrawer.value = false
    })
}

const onDelete = () => {
    if (selectedContact.value?.id) {
        remove(selectedContact.value.id, {
            onSuccess: () => showDeleteDialog.value = false
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
                    :columns="contactFilters"
                    v-model:filters="filters" 
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
            <Button @click="onCreateContact()">
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

        <ContactTable
            v-model:rowsPerPage="rowsPerPage"
            :loading="loading"
            :dataPage="dataPage"
            :currentPageReport="currentPageReport"
            :filters="filters"
            @loadPage="(pageNumber: number) => fetchDataPage(pageNumber, rowsPerPage)"
            @updateContact="(contactItem: ContactItem) => onCreateContact(contactItem)"
            @deleteContact="(contactItem: ContactItem) => onDeleteContact(contactItem)"
        />

        <DeleteDialog 
            v-model:visible="showDeleteDialog" 
            :title="$t('contacts.delete_contact')"
            :message="$t('contacts.delete_message')"
            @onConfirm="onDelete" 
        />
        <ContactDrawer 
            v-model:visible="showContactDrawer"
            :fields="contactFieldStore.contactFields"
            :title="selectedContact ? $t('contacts.edit_contact') : $t('contacts.create_contact')"
            :loading="loadingDrawer"
            :contact="selectedContact"
            @onConfirm="onSave"
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