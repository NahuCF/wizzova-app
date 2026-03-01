<script setup lang="ts">
import type { DataTablePageEvent } from 'primevue'
import { computed, onMounted, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { IconLoader2, IconPlus } from '@tabler/icons-vue'
import moment from 'moment'
import { API } from '~/services'
import { IconEdit, IconTrash, IconList, IconLayoutGrid, IconSearch } from '@tabler/icons-vue'
import type {
  Column,
  LayoutMode,
  PageWithTemplatesCount,
  TemplateBroadcast,
  TemplateCreate,
  TemplateItem,
} from '~/types'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useCrudActions } from '~/composables/useCrudActions'
import { useTemplateStore } from '~/stores/template'

const { t } = useI18n()
const router = useRouter()
const {
  dataPage,
  loading,
  searchTerm,
  rowsPerPage,
  currentPageReport,
  fetchDataPage,
  loadNextPage,
  debouncedFetch,
} = usePaginatedData<TemplateItem, PageWithTemplatesCount<TemplateItem>>(
  (page, perPage, search) =>
    API.template.index({ page, name: search, perPage }).then((res) => res.data),
  12,
)

const { loading: loadingDelete, remove } = useCrudActions<TemplateCreate>({
  api: {
    delete: API.template.delete,
  },
  fetchData: fetchDataPage,
  i18nKeys: {
    deleted: 'templates.template_deleted',
  },
})

const templateStore = useTemplateStore()

const dailyLimit = (item: TemplateItem) => item.days_since_meta_update < 1
const monthlyLimit = (item: TemplateItem) =>
  item.days_since_meta_update < 30 && item.updated_count_while_approved === 10

const loadingBroadcasts = ref(false)
const showBroadcastsDialog = ref(false)
const templateBroadcasts = ref<TemplateBroadcast[]>()
const layoutOptions = ref<
  {
    label: string
    mode: LayoutMode
    icon: Component
  }[]
>([
  {
    label: 'list',
    mode: 'LIST',
    icon: IconList,
  },
  {
    label: 'grid',
    mode: 'GRID',
    icon: IconLayoutGrid,
  },
])
const templateActions = (item: TemplateItem) => {
  let tooltip = ''

  if (item.status === 'APPROVED' && dailyLimit(item)) {
    tooltip = t('templates.daily_limit_reached')
  }
  if (item.status === 'APPROVED' && monthlyLimit(item)) {
    tooltip = t('templates.monthly_limit_reached')
  }

  return [
    [
      {
        label: t('template.edit'),
        icon: IconEdit,
        class: '',
        disabled: item.status === 'APPROVED' && (dailyLimit(item) || monthlyLimit(item)),
        tooltip: tooltip,
        action: () => {
          router.push({
            name: 'edit-template',
            params: { id: item.id },
          })
        },
      },
    ],
    [
      {
        label: t('template.delete'),
        class: 'text-red-600',
        icon: loadingBroadcasts.value ? IconLoader2 : IconTrash,
        iconClass: loadingBroadcasts.value ? 'animate-spin' : '',
        disabled: loadingBroadcasts.value,
        action: async () => {
          loadingBroadcasts.value = true
          try {
            const { data: response } = await API.template.activeBroadcasts(item.id)

            if (response.data.length === 0) {
              deleteId.value = item.id
              showDeleteDialog.value = true
            } else {
              templateBroadcasts.value = response.data
              showBroadcastsDialog.value = true
            }
          } catch (error) {
            console.log(error)
          } finally {
            loadingBroadcasts.value = false
          }
        },
      },
    ],
  ]
}
const popover = ref()
const deleteId = ref('')
const showDeleteDialog = ref(false)

const columns = ref<Column[]>([
  {
    header: t('template.name'),
    key: 'name',
  },
  {
    header: t('template.message'),
    key: 'message',
    bodyStyle: { maxWidth: '300px' },
  },
  {
    header: t('template.language_code'),
    key: 'languageCode',
  },
  {
    header: t('template.created_at'),
    key: 'createdAt',
  },
  {
    header: t('template.category'),
    key: 'category',
  },
  {
    header: t('template.status'),
    key: 'status',
    type: 'CUSTOM',
  },
  {
    header: '',
    key: 'actions',
    type: 'ACTIONS',
  },
])

const transformedData = computed(() => {
  return dataPage.value.data.map((item) => ({
    ...item,
    message: item.components.body?.content ?? '',
    languageCode: item.language.toUpperCase(),
    createdAt: moment(item.created_at).format('DD/MM/YYYY'),
    actions: templateActions,
  }))
})

const templatesLimit = computed(() => dataPage.value.meta.templates_count >= 6000)

const changeLayout = (layoutMode: LayoutMode) => {
  templateStore.activeLayout = layoutMode

  if (layoutMode === 'GRID') {
    rowsPerPage.value = 12
  } else {
    rowsPerPage.value = 10
  }

  fetchDataPage(1, rowsPerPage.value)
}

const onSearch = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  searchTerm.value = value.replace(/[^a-zA-Z0-9]/g, '_')
  debouncedFetch()
}

const onPage = (event: DataTablePageEvent) => {
  rowsPerPage.value = event.rows
  const page = Math.floor(event.first / event.rows) + 1
  fetchDataPage(page, rowsPerPage.value)
}

const onDelete = () => {
  remove(deleteId.value, {
    onSuccess: () => {
      showDeleteDialog.value = false
    },
  })
}

onMounted(() => {
  fetchDataPage(1, rowsPerPage.value)
})
</script>

<template>
  <div class="flex flex-col p-6">
    <div class="flex justify-between items-center z-2 bg-slate-100">
      <h1 class="font-semibold text-2xl">{{ t('templates.whatsapp_templates') }}</h1>
      <Button
        :disabled="templatesLimit"
        v-tooltip.bottom="
          templatesLimit && {
            value: t('templates.templates_limit_reached'),
            class: 'text-base max-w-[300px]!',
          }
        "
        @click="router.push({ name: 'new-template' })"
      >
        <IconPlus size="16" />
        <span>
          {{ $t('templates.create_new_template') }}
        </span>
      </Button>
    </div>
    <div class="flex items-center gap-3 pt-6 pb-8">
      <div class="relative">
        <IconSearch
          size="14"
          class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
        />
        <InputText
          v-model="searchTerm"
          class="pl-8! max-w-[300px] shadow-none!"
          name="search"
          id="search"
          fluid
          :placeholder="$t('templates.search_templates')"
          @input="onSearch"
        />
      </div>

      <ButtonGroup>
        <Button
          v-for="option in layoutOptions"
          :key="option.mode"
          :variant="templateStore.activeLayout !== option.mode ? 'outlined' : 'solid'"
          class="border-emerald-500!"
          @click="changeLayout(option.mode)"
        >
          <component :is="option.icon" class="w-[16px] h-[16px]" />
          <span>
            {{ $t(option.label) }}
          </span>
        </Button>
      </ButtonGroup>
    </div>

    <div v-if="templateStore.activeLayout === 'LIST'" class="flex flex-col h-full">
      <Table
        :data="transformedData"
        :columns="columns"
        emptyMessage="template.empty"
        :loading="loading"
        withPagination
        :totalRecords="dataPage.meta.total"
        :rowsPerPage="rowsPerPage"
        :showPageSize="false"
        :currentPageReport="currentPageReport"
        @onPage="onPage"
      >
        <template #status="{ data }: { data: TemplateItem }">
          <div class="flex flex-col items-start">
            <StatusBadge :status="data.status" :label="$t(`template_status.${data.status}`)" />
          </div>
        </template>
      </Table>
    </div>
    <div v-else>
      <TemplateCardList
        :templates="dataPage.data"
        :loading="loading"
        showCreateCard
        :cardProps="{
          actions: templateActions,
        }"
        @reach-end="loadNextPage"
      />
    </div>

    <WarningDialog
      v-model:visible="showDeleteDialog"
      :title="$t('templates.delete_template')"
      :message="$t('templates.delete_message')"
      :loading="loadingDelete"
      @onConfirm="onDelete"
    />
    <WarningDialog
      v-model:visible="showBroadcastsDialog"
      :title="$t('templates.active_broadcasts')"
      :message="$t('templates.active_broadcasts_message')"
      :confirmMessage="$t('accept')"
      @onConfirm="showBroadcastsDialog = false"
    >
      <template #note>
        <div class="flex flex-col gap-1 pb-4 px-6">
          <div
            v-for="broadcast in templateBroadcasts"
            :key="broadcast.id"
            class="text-surface-500 dark:text-surface-400 text-gray-600"
          >
            {{ broadcast.name }}
          </div>
        </div>
      </template>
    </WarningDialog>
  </div>
</template>
