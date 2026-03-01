<script setup lang="ts">
import { Select, DataTable, Column, Tag, Message } from 'primevue'
import { IconCheck, IconX } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { MappingContact, ContactFieldItem } from '~/types'

const props = defineProps<{
  mappingRows: MappingContact[]
  validationErrors: string[]
  contactFields: ContactFieldItem[]
}>()

const emit = defineEmits<{
  (e: 'update:mappingRows', value: MappingContact[]): void
}>()

const { t } = useI18n()

const onFieldUpdate = (row: MappingContact, field: ContactFieldItem | null) => {
  row.contactField = field
  row.status = field ? 'MAPPED' : 'NOT_MAPPED'
  emit('update:mappingRows', [...props.mappingRows])
}
</script>

<template>
  <div>
    <div class="text-slate-500 font-bold text-lg pb-4">
      {{ t('contacts.import_dialog.map_columns') }}
    </div>
    <div class="pb-8">
      {{ t('contacts.import_dialog.step2_description') }}
    </div>

    <DataTable
      :value="mappingRows"
      class="rounded-lg overflow-hidden"
      stripedRows
      responsiveLayout="scroll"
    >
      <Column
        field="excelColumn"
        :header="t('contacts.import_dialog.excel_column')"
        headerClass="bg-slate-200!"
      />
      <Column
        field="value"
        :header="t('contacts.import_dialog.sample_value')"
        headerClass="bg-slate-200!"
      />
      <Column :header="t('contacts.import_dialog.contact_field')" headerClass="bg-slate-200!">
        <template #body="slotProps">
          <Select
            v-model="slotProps.data.contactField"
            :options="contactFields"
            optionLabel="name"
            :placeholder="t('contacts.import_dialog.select_placeholder')"
            class="w-full"
            showClear
            @update:modelValue="(val) => onFieldUpdate(slotProps.data, val)"
          />
        </template>
      </Column>
      <Column
        field="status"
        :header="t('contacts.import_dialog.mapping_status')"
        bodyClass="text-sm"
        headerClass="bg-slate-200!"
      >
        <template #body="slotProps">
          <Tag :severity="slotProps.data.status === 'MAPPED' ? 'success' : 'danger'" rounded>
            <div class="flex items-center gap-2">
              <IconCheck v-if="slotProps.data.status === 'MAPPED'" size="14" />
              <IconX v-else size="14" />
              <div>
                {{ t(`contacts.import_dialog.${slotProps.data.status.toLowerCase()}`) }}
              </div>
            </div>
          </Tag>
        </template>
      </Column>
    </DataTable>

    <Message
      v-for="error in validationErrors"
      :key="error"
      severity="error"
      :closable="false"
      class="my-2"
    >
      {{ error }}
    </Message>
  </div>
</template>
