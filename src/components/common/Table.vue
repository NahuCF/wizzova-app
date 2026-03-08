<script setup lang="ts" generic="T">
import type { DataTablePageEvent } from 'primevue'
import { IconDotsVertical, IconInfoCircle } from '@tabler/icons-vue'
import { computed, ref, watch } from 'vue'
import type { ActionGenerator, Column } from '~/types'

const props = withDefaults(
  defineProps<{
    data: T[]
    columns: Column[]
    selection?: T[]
    emptyMessage?: string
    loading?: boolean
    withPagination?: boolean
    totalRecords?: number
    rowsPerPage?: number
    showPageSize?: boolean
    currentPageReport?: string
    hoverable?: boolean
  }>(),
  {
    emptyMessage: 'table_empty',
    showPageSize: true,
  },
)

const emit = defineEmits<{
  (e: 'update:rowsPerPage', value: number): void
  (e: 'update:selection', data: T[]): void
  (e: 'onPage', event: DataTablePageEvent): void
  (e: 'onRowClick', event: { data: T; originalEvent: any }): void
}>()

const actionGenerator = ref<ActionGenerator<T>>()
const taglistPopover = ref()
const actionMenu = ref()
const tableWrapper = ref<HTMLElement>()
const hoverTags = ref<string[]>([])
const lockedHeight = ref<string>()
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.loading,
  (isLoading) => {
    if (isLoading) {
      lockedHeight.value = tableWrapper.value ? `${tableWrapper.value.offsetHeight}px` : undefined
    } else {
      lockedHeight.value = undefined
    }
  },
)

const total = computed(() => {
  return props.totalRecords || props.data.length
})

const paginatorTemplate = computed(() => {
  if (props.withPagination) {
    return 'FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink'
  }

  return undefined
})

const onHover = (event: MouseEvent, tags: string[]) => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  hoverTags.value = tags
  taglistPopover.value.show(event)
}

const onLeave = () => {
  hoverTimeout = setTimeout(() => {
    taglistPopover.value.hide()
  }, 300)
}

const openActionMenu = (event: MouseEvent, actions: ActionGenerator<T>, item: T) => {
  actionGenerator.value = actions
  actionMenu.value?.show(event, item)
}
</script>

<template>
  <div ref="tableWrapper" class="overflow-auto" :style="{ minHeight: lockedHeight }">
    <DataTable
      :value="data"
      :selection="selection"
      @update:selection="(data) => emit('update:selection', data)"
      dataKey="id"
      class="rounded-lg overflow-hidden"
      :lazy="withPagination"
      :paginator="withPagination"
      :loading="loading"
      :rows="rowsPerPage"
      :totalRecords="total"
      scrollable
      scrollHeight="flex"
      :paginatorTemplate="paginatorTemplate"
      :currentPageReportTemplate="currentPageReport"
      :rowHover="hoverable"
      :rowClass="() => (hoverable ? 'cursor-pointer' : '')"
      @rowClick="emit('onRowClick', $event)"
      @page="emit('onPage', $event)"
    >
      <template #empty>
        <div class="text-center text-base py-4 text-gray-500">
          {{ $t(emptyMessage) }}
        </div>
      </template>

      <template v-if="withPagination && showPageSize" #paginatorstart>
        <div class="flex items-center gap-2">
          <label for="rows" class="text-base font-bold!">
            {{ $t('show_rows_per_page') }}
          </label>
          <Select
            id="rows"
            :model-value="rowsPerPage"
            @change="(value) => emit('update:rowsPerPage', value.value)"
            :options="[10, 20, 50]"
          />
        </div>
      </template>

      <Column
        v-if="selection"
        selectionMode="multiple"
        headerStyle="width: 3rem"
        headerClass="bg-slate-200!"
      ></Column>

      <Column
        v-for="column in columns"
        :key="column.key"
        headerClass="bg-slate-200!"
        bodyClass="h-[50px]"
        :bodyStyle="column.bodyStyle"
      >
        <template #header>
          <div v-if="!column.tooltip" class="uppercase font-semibold text-base">
            {{ column.header }}
          </div>

          <div v-else class="flex gap-1 items-center uppercase font-semibold text-base">
            {{ column.header }}
            <div
              v-tooltip.bottom="{
                value: column.tooltip,
                class: 'max-w-[250px]!',
              }"
            >
              <IconInfoCircle class="hover:cursor-pointer" size="14" />
            </div>
          </div>
        </template>

        <template #body="{ data }">
          <Tag
            v-if="column.type === 'TAG'"
            :value="data[column.key].label"
            :severity="data[column.key].severity"
            class="text-base!"
          />

          <div v-else-if="column.type === 'TAG_LIST'" class="flex items-center gap-2">
            <template v-for="(tag, index) in data[column.key]" :key="index">
              <Tag v-if="index === 0" class="px-3! text-nowrap" rounded>
                {{ tag }}
              </Tag>
            </template>
            <div @mouseenter="onHover($event, data[column.key])" @mouseleave="onLeave">
              <Badge v-if="data[column.key].length > 1" severity="secondary">
                +{{ data[column.key].length - 1 }}
              </Badge>
            </div>
          </div>

          <template v-else-if="column.type === 'PROGRESS'">
            <div class="flex gap-2 items-center">
              <CircularProgress
                :progress="data[column.key].percentage"
                :color="data[column.key].color"
              />
              <div class="flex flex-col gap-0.5">
                <span class="text-base">{{ data[column.key].count }}</span>
                <span class="text-base text-gray-500"> {{ data[column.key].percentage }}% </span>
              </div>
            </div>
          </template>

          <template v-else-if="column.type === 'ACTIONS'">
            <div v-if="data[column.key](data).length > 0" class="flex justify-center">
              <Button
                severity="secondary"
                variant="text"
                @click="openActionMenu($event, data[column.key], data)"
              >
                <IconDotsVertical size="13" />
              </Button>
            </div>
          </template>

          <template v-else-if="column.type === 'CUSTOM'">
            <slot :name="column.key" :data="data"> </slot>
          </template>

          <span v-else class="block whitespace-nowrap overflow-hidden text-ellipsis text-base">
            {{ data[column.key] }}
          </span>
        </template>
      </Column>
    </DataTable>

    <Popover
      ref="taglistPopover"
      :showCloseIcon="false"
      :dismissable="false"
      placement="bottom"
      class="p-2 text-base shadow-md rounded-md bg-white border"
    >
      <div class="flex flex-col gap-2">
        <template v-for="(tag, index) in hoverTags" :key="index">
          <Tag v-if="index !== 0" class="px-3! text-nowrap" rounded>
            {{ tag }}
          </Tag>
        </template>
      </div>
    </Popover>

    <ActionsPopover ref="actionMenu" :actions="actionGenerator" />
  </div>
</template>

<style lang="css" scoped>
:deep(.p-paginator-current) {
  font-size: 1rem;
}
</style>
