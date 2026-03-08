<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconX, IconLoader2, IconUsers } from '@tabler/icons-vue'
import { useContactFilters } from '~/composables/useContactFilters'
import { useContactFieldStore } from '~/stores'
import type {
  ContactGroupItem,
  ContactItem,
  CreateContactGroup,
  Filter,
  FilterOperator,
} from '~/types'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'

const props = defineProps<{
  visible: boolean
  title: string
  loading?: boolean
  group?: ContactGroupItem
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', groupData: CreateContactGroup): void
}>()

const { t } = useI18n()
const contactFieldStore = useContactFieldStore()
const { columns: contactFilters, flattenFilters, unflattenFilters } = useContactFilters()

const { dataPage, loading, rowsPerPage, currentPageReport, fetchDataPage } =
  usePaginatedData<ContactItem>(
    (page, perPage, search) =>
      API.contact
        .index(page, perPage, search, flattenFilters(filters.value))
        .then((res) => res.data),
    10,
  )

const groupId = ref('')
const name = ref('')
const filters = ref<Filter[]>([])
const filtersPopover = ref()

const flatFilters = computed(() => {
  return flattenFilters(filters.value)
})

const formatCondition = (
  contactFieldId: string,
  condition: { operator: FilterOperator | ''; value: string[]; labels?: string[] },
) => {
  const field = contactFieldStore.contactFields.find((f) => f.id === contactFieldId)
  const opLabel = t(`filters.operators.${condition.operator}`) || condition.operator

  const displayValues =
    condition.labels && condition.labels.length === condition.value.length
      ? condition.labels
      : condition.value

  let valStr = displayValues?.join(', ') || ''
  if (field?.type === 'SWITCH') {
    valStr = condition.value?.map((v) => (Boolean(v) ? t('yes') : t('no'))).join(', ') || ''
  }

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

const resetFilters = () => {
  filters.value = []
}

const togglePopover = (event: MouseEvent) => {
  filtersPopover.value.toggle(event)
}

const cannotConfirm = () => {
  return name.value.trim() === '' || dataPage.value.data.length === 0
}

const onConfirm = () => {
  const groupData: CreateContactGroup = {
    id: groupId.value,
    name: name.value,
    filters: flatFilters.value,
  }

  emit('confirm', groupData)
}

watch(rowsPerPage, () => fetchDataPage(1, rowsPerPage.value))

watch(
  filters,
  () => {
    fetchDataPage(1, rowsPerPage.value)

    if (flatFilters.value.length <= 2) {
      filtersPopover.value?.hide()
    }
  },
  { deep: true },
)

watch(
  () => props.visible,
  () => {
    if (props.visible) {
      groupId.value = props.group?.id || ''
      name.value = props.group?.name || ''
      filters.value = unflattenFilters(props.group?.filters || [])
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :draggable="false"
    contentClass="p-0! h-full"
    class="min-w-[25rem] max-w-[1088px] w-full"
  >
    <template #header>
      <div class="text-2xl font-semibold">
        {{ title }}
      </div>
    </template>
    <div class="h-full px-5 pb-5 pt-1">
      <div class="flex justify-between items-center pb-6">
        <div class="flex items-center flex-wrap gap-2">
          <GenericFilters :columns="contactFilters" :disabled="loading" v-model:filters="filters" />

          <template v-for="(filter, fIndex) in filters" :key="fIndex">
            <template v-for="(condition, cIndex) in filter.conditions" :key="cIndex">
              <div v-if="fIndex + cIndex < 2">
                <Tag class="px-3!" rounded>
                  {{ formatCondition(filter.columnId, condition) }}
                  <Button
                    variant="text"
                    rounded
                    class="p-0.5!"
                    @click="removeFromFilter(fIndex, cIndex)"
                  >
                    <IconX class="w-4 h-4" />
                  </Button>
                </Tag>
              </div>
            </template>
          </template>

          <div>
            <Badge
              v-if="flatFilters.length > 2"
              severity="secondary"
              class="cursor-pointer"
              @click="togglePopover"
            >
              +{{ flatFilters.length - 2 }}
            </Badge>
          </div>

          <Popover
            ref="filtersPopover"
            :showCloseIcon="false"
            :dismissable="true"
            placement="bottom"
            class="p-2 text-sm shadow-md rounded-md bg-white border"
          >
            <div class="flex flex-col gap-2">
              <template v-for="(filter, fIndex) in filters" :key="fIndex">
                <template v-for="(condition, cIndex) in filter.conditions" :key="cIndex">
                  <div v-if="fIndex + cIndex >= 2">
                    <Tag class="px-3!" rounded>
                      {{ formatCondition(filter.columnId, condition) }}
                      <Button
                        variant="text"
                        rounded
                        class="p-0.5!"
                        @click="removeFromFilter(fIndex, cIndex)"
                      >
                        <IconX class="w-4 h-4" />
                      </Button>
                    </Tag>
                  </div>
                </template>
              </template>
            </div>
          </Popover>

          <Button v-if="filters.length > 0" variant="text" @click="resetFilters">
            {{ $t('contact_groups.dialog.reset') }}
          </Button>
        </div>

        <div class="flex items-center gap-3" v-if="filters.length > 0">
          <div
            v-if="dataPage.meta.total > 0"
            class="flex items-center gap-1.5 text-sm font-medium text-emerald-600 whitespace-nowrap"
          >
            <IconUsers size="16" />
            <span>{{ dataPage.meta.total.toLocaleString() }} {{ t('contact_groups.dialog.contacts_found') }}</span>
          </div>
          <div>
            <InputText
              v-model="name"
              class="max-w-[180px] shadow-none!"
              name="name"
              id="name"
              fluid
              :placeholder="$t('contact_groups.dialog.enter_group_name')"
            />
          </div>
          <div>
            <Button
              :disabled="cannotConfirm() || loading || props.loading"
              @click="onConfirm"
              v-tooltip.bottom="
                dataPage.data.length === 0 && {
                  value: t('contact_groups.dialog.create_group_tooltip'),
                  class: 'max-w-[300px]!',
                }
              "
            >
              <IconLoader2 v-if="props.loading" class="animate-spin w-6 h-6" />
              <span v-else>
                {{
                  group
                    ? $t('contact_groups.dialog.edit_group')
                    : $t('contact_groups.dialog.create_group')
                }}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <div v-if="filters.length > 0" class="message-container">
        <ContactTable
          v-model:rowsPerPage="rowsPerPage"
          :loading="loading"
          :dataPage="dataPage"
          :currentPageReport="currentPageReport"
          :filters="filters"
          @loadPage="(pageNumber: number) => fetchDataPage(pageNumber, rowsPerPage)"
          :readonly="true"
        />
      </div>
      <div v-else class="message-container flex justify-center items-center">
        <span>{{ $t('contact_groups.dialog.message') }}</span>
      </div>
    </div>
  </Dialog>
</template>

<style lang="css" scoped>
:deep(.p-paginator-current) {
  font-size: 0.875rem;
}

:deep(.p-datatable-paginator-bottom) {
  border: none;
}

.message-container {
  height: calc(80vh - 48px - 32px - 12px);
}
</style>
