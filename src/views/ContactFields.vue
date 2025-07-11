<script setup lang="ts">
import { IconEdit, IconTrash, IconPlus, IconLoader2, IconToggleLeft, IconTextWrap, 
    IconCalendar, IconUserCircle, IconHash, IconInfoCircle, IconTypography, IconCircleDot } from '@tabler/icons-vue'
import { ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { ContactFieldType, ContactFieldItem, ContactFieldCreate } from '~/types'
import { useToast } from 'primevue'
import { useCrudActions } from '~/composables/useCrudActions'

const { t } = useI18n()
const toast = useToast()
const {
  dataPage,
  loading,
  rowsPerPage,
  fetchDataPage,
  loadNextPage,
} = usePaginatedData<ContactFieldItem>(
  (page, perPage) => API.contactField.index(page, perPage).then(res => res.data),
  10
)

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<ContactFieldCreate>({
    api: {
        create: API.contactField.create,
        update: API.contactField.update,
        delete: API.contactField.delete,
    },
    fetchData: fetchDataPage,
    rowsPerPage,
    i18nKeys: {
        created: 'contact_fields.field_created',
        updated: 'contact_fields.field_updated',
        deleted: 'contact_fields.field_deleted',
    }
})

const popover = ref()
const showFieldDrawer = ref(false)
const showDeleteDialog = ref(false)
const selectedField = ref<ContactFieldItem | undefined>()
const types = ref<ContactFieldType[]>([])
const typeIcon = ref<Record<ContactFieldType, Component>>({
    'SELECT': IconCircleDot,
    'NUMBER': IconHash,
    'TEXT': IconTypography,
    'MULTI_TEXT': IconTextWrap,
    'USER': IconUserCircle,
    'SWITCH': IconToggleLeft,
    'DATE': IconCalendar
})

const openFieldDrawer = (contactField?: ContactFieldItem) => {
    selectedField.value = contactField
    showFieldDrawer.value = true
}

const fieldOptions = ref([
	[
		{
			label: 'contact_field.edit',
			icon: IconEdit,
			action: openFieldDrawer
		}
	],
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (contactField: ContactFieldItem) => {
                selectedField.value = contactField
                showDeleteDialog.value = true
            }
		}
	]
])

const fetchTypes = async () => {
    const response = await API.contactField.types()
    types.value = response.data.data
}

const onSaveField = (contactField: ContactFieldCreate) => {
    createOrUpdate(contactField, {
        onSuccess: () => showFieldDrawer.value = false
    })
}

const onDeleteField = () => {
    if (selectedField.value?.id) {
        remove(selectedField.value.id, {
            onSuccess: () => showDeleteDialog.value = false
        })
    }
}

const handleUpdate = async <T>(action: () => Promise<T>) => {
    try {
        await action()
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: t('contact_fields.field_updated'),
            life: 3000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: t('an_error_occurred'),
            life: 3000,
        })
    }
}

const updateStatus = (id: number, value: boolean) => {
    return handleUpdate(() => API.contactField.changeStatus(id, value))
}

const updateMandatory = (id: number, value: boolean) => {
    return handleUpdate(() => API.contactField.changeMandatory(id, value))
}

fetchDataPage(1, rowsPerPage.value)
fetchTypes()
</script>

<template>
    <div class="flex flex-col gap-5 custom-datatable p-6">
        <div class="flex justify-between items-center py-5 z-2 bg-slate-100">
			<h1 class="font-semibold text-2xl">{{ t('contact_fields.field_collection') }}</h1>
			<Button @click="openFieldDrawer()">
				<IconPlus size="16" class="mr-2" />
				<span>
					{{ $t('contact_fields.add') }}
				</span>
			</Button>
		</div>

        <DataTable 
            :value="dataPage.data"
            dataKey="id"
            :lazy="true"
            :loading="loading"
            :rows="rowsPerPage"
            :totalRecords="dataPage.meta.total"
            scrollable
            scrollHeight="flex"
            size="large"
            :rowClass="() => 'h-[69px]'"
        >
            <template #empty>
                <div class="text-center py-4 text-gray-500">
                    {{ $t('contact_fields.not_found') }}
                </div>
            </template>
            
            <Column field="name">
                <template #header>
                    <div class="flex items-center gap-4">
                        <div class="w-[20px]"></div>
                        <div class="flex items-center gap-1 text-sm uppercase">
                            {{ $t('contact_field.name') }}
                            <div
                                v-tooltip.bottom="{
                                    value: t('contact_field.name_info'),
                                    class: 'text-sm max-w-[250px]!'
                                }"
                            >
                                <IconInfoCircle class="hover:cursor-pointer" size="16" />
                            </div>
                        </div>
                    </div>
                </template>

                <template #body="{ data }: { data: ContactFieldItem }">
                    <div class="flex items-center gap-4">
                        <div
                            v-tooltip.bottom="{
                                value: data.is_primary_field 
                                    ? t('contact_field.is_primary', { field: data.name}) 
                                    : t('contact_field.is_secondary', { field: data.name}),
                                class: 'text-sm max-w-[250px]!'
                            }"
                        >
                            <IconInfoCircle class="text-blue-500 hover:cursor-pointer" size="20" />
                        </div>
                        {{ data.name }}
                    </div>
                </template>
            </Column>

            <Column field="internal_name" headerClass="text-sm uppercase">
                <template #header>
                    <div class="flex items-center gap-1 text-sm uppercase">
                        {{ $t('contact_field.internal_name') }}
                        <div
                            v-tooltip.bottom="{
                                value: t('contact_field.internal_name_info'),
                                class: 'text-sm max-w-[250px]!'
                            }"
                        >
                            <IconInfoCircle class="hover:cursor-pointer" size="16" />
                        </div>
                    </div>
                </template>
            </Column>

            <Column :header="$t('contact_field.type')" headerClass="text-sm uppercase">
                <template #body="{ data }: { data: ContactFieldItem }">
                    <div class="flex flex-row items-center gap-2">
                        <component
                            :is="typeIcon[data.type]"
                            class="w-[22px] h-[22px]"
                        />
                        {{ data.type }}
                    </div>
                </template>
            </Column>

            <Column :header="$t('contact_field.status')" headerClass="text-sm uppercase">
                <template #body="{ data }">
                    <ToggleSwitch 
                        :modelValue="data.is_active"
                        @update:model-value="(value) => updateStatus(data.id, value)"
                        :readonly="data.is_primary_field" 
                        :class="{ 'opacity-50': data.is_primary_field }" 
                    />
                </template>
            </Column>

            <Column :header="$t('contact_field.mandatory')" headerClass="text-sm uppercase">
                <template #body="{ data }">
                    <ToggleSwitch 
                        :modelValue="data.is_mandatory"
                        @update:model-value="(value) => updateMandatory(data.id, value)"
                        :readonly="data.is_primary_field" 
                        :class="{ 'opacity-50': data.is_primary_field }" 
                    />
                </template>
            </Column>

            <Column>
                <template #body="{ data }">
                    <ActionButton v-if="!data.is_primary_field" @click="(e: Event) => popover?.show(e, data)" />
                </template>
            </Column>
        </DataTable>

        <div class="flex justify-center pb-20">
            <Button @click="loadNextPage()">
                <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                <span v-else-if="dataPage.data.length === dataPage.meta.total">
                    {{ $t('contact_fields.no_more_to_load') }}
                </span>
                <span v-else>
                    {{ $t('contact_fields.load_more') }}
                </span>
            </Button>
        </div>

        <ActionsPopover ref="popover" :options="fieldOptions" />
        <ContactFieldDrawer 
            v-model:visible="showFieldDrawer"
            :loading="loadingDrawer"
            :types="types"
            :contactField="selectedField"
            @onSave="onSaveField" 
        />
        <DeleteDialog 
            v-model:visible="showDeleteDialog" 
            :title="$t('contact_fields.delete_field')"
            :message="$t('contact_fields.delete_message')"
            :note="$t('contact_fields.delete_note')"
            @onConfirm="onDeleteField" 
        />
    </div>
</template>

<style lang="css">
.custom-datatable {
  --p-datatable-column-title-font-weight: 400;
  
}
</style>