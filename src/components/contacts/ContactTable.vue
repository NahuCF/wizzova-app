<script setup lang="ts">
import { IconTrash, IconEdit } from '@tabler/icons-vue'
import type { DataTablePageEvent } from 'primevue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore } from '~/stores'
import type {
  Column,
  ContactFieldRecord,
  ContactFieldValue,
  ContactItem,
  Filter,
  Page,
} from '~/types'

const props = defineProps<{
  loading: boolean
  dataPage: Page<ContactItem>
  rowsPerPage: number
  currentPageReport: string
  filters: Filter[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:rowsPerPage', rowsPerPage: number): void
  (e: 'load-page', pageNumber: number): void
  (e: 'update-contact', contactItem: ContactItem): void
  (e: 'delete-contact', contactItem: ContactItem): void
}>()

const { t, te } = useI18n()
const contactFieldStore = useContactFieldStore()

const contactActions = (contactRecord: ContactFieldRecord) => {
  const contactItem = props.dataPage.data.find((cf) => cf.id === contactRecord['id'])
  const inActiveBroadcast = contactItem?.active_broadcast_count

  return [
    [
      {
        label: t('contacts.edit'),
        icon: IconEdit,
        disabled: inActiveBroadcast,
        tooltip: inActiveBroadcast
          ? t('validation_errors.contact_has_active_broadcasts')
          : undefined,
        action: () => {
          if (contactItem) {
            emit('update-contact', contactItem)
          }
        },
      },
    ],
    [
      {
        label: t('delete'),
        class: 'text-red-600',
        icon: IconTrash,
        disabled: inActiveBroadcast,
        tooltip: inActiveBroadcast
          ? t('validation_errors.contact_has_active_broadcasts')
          : undefined,
        action: () => {
          if (contactItem) {
            emit('delete-contact', contactItem)
          }
        },
      },
    ],
  ]
}

const columns = computed(() => {
  let fieldColumns: Column[] = contactFieldStore.primaryFields.map((cf) => ({
    header: te(`contacts.headers.${cf.name}`) ? t(`contacts.headers.${cf.name}`) : cf.name,
    key: cf.name,
    type: 'CUSTOM',
    bodyStyle: { maxWidth: '100px' },
  }))

  if (!props.readonly) {
    fieldColumns = [
      ...fieldColumns,
      {
        header: '',
        key: 'actions',
        type: 'ACTIONS',
        bodyStyle: { maxWidth: '50px' },
      },
    ]
  }

  return fieldColumns
})

const transformedData = computed(() => {
  return props.dataPage.data.map((contact) => {
    const contactObject = contact.fields.reduce((acc, field) => {
      acc[field.name] = field.value
      return acc
    }, {} as ContactFieldRecord)

    return {
      ...contactObject,
      id: contact.id,
      actions: contactActions,
    }
  })
})

const onPage = (event: DataTablePageEvent) => {
  if (props.rowsPerPage !== event.rows) {
    emit('update:rowsPerPage', event.rows)
  } else {
    const page = Math.floor(event.first / event.rows) + 1
    emit('load-page', page)
  }
}

const formatField = (contactFieldValue: ContactFieldValue | undefined, columnName: string) => {
  if (contactFieldValue === undefined) {
    return `No ${columnName}`
  }

  if (Array.isArray(contactFieldValue)) {
    return contactFieldValue.join(', ')
  } else if (typeof contactFieldValue === 'boolean') {
    return Boolean(contactFieldValue) ? t('yes') : t('no')
  } else {
    return contactFieldValue
  }
}
</script>

<template>
  <Table
    :data="transformedData"
    :columns="columns"
    emptyMessage="contacts.empty"
    :loading="loading"
    withPagination
    :totalRecords="dataPage.meta.total"
    :rowsPerPage="rowsPerPage"
    @update:rowsPerPage="emit('update:rowsPerPage', $event)"
    :currentPageReport="currentPageReport"
    @onPage="onPage"
  >
    <template
      v-for="column in columns"
      :key="cf.key"
      #[column.key]="{ data }: { data: ContactFieldRecord }"
    >
      <div class="flex">
        <span
          class="block whitespace-nowrap overflow-hidden text-ellipsis text-base"
          :class="{ 'opacity-25': data[column.key] === undefined }"
          v-tooltip.bottom="
            Array.isArray(data[column.key])
              ? {
                  value: (data[column.key] as string[]).join('\n'),
                  class: 'text-base max-w-[300px]!',
                }
              : undefined
          "
        >
          {{ formatField(data[column.key], column.header) }}
        </span>
      </div>
    </template>
  </Table>
</template>
