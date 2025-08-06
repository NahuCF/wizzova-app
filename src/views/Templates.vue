<script setup lang="ts">
import type { DataTablePageEvent } from 'primevue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { IconPlus } from '@tabler/icons-vue'
import moment from 'moment'
import { API } from '~/services'
import { IconEdit, IconTrash, IconList, IconLayoutGrid, IconSearch } from '@tabler/icons-vue'
import type { TemplateCreate, TemplateItem } from '~/types'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { useCrudActions } from '~/composables/useCrudActions'

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
} = usePaginatedData<TemplateItem>(
  (page, perPage, search) => API.template.index(page, search, perPage).then(res => res.data),
  12
)

const {
	loading: loadingDelete,
	remove
} = useCrudActions<TemplateCreate>({
	api: {
		delete: API.template.delete
	},
	fetchData: fetchDataPage,
	i18nKeys: {
		deleted: 'templates.template_deleted'
	}
})

const activeLayout = ref(1)
const layoutOptions = ref([
	{
		label: 'list',
		icon: IconList
	},
	{
		label: 'grid',
		icon: IconLayoutGrid
	}
])
const templateOptions = ref([
	[
		{
			label: 'template.edit',
			icon: IconEdit,
			class: '',
			action: (item: TemplateItem) => {
				router.push({ 
					name: 'edit-template', 
					params: { id: item.id }
				})
			}
		}
	],
	[
		{
			label: 'template.delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (item: TemplateItem) => {
				deleteId.value = item.id
				showDeleteDialog.value = true
			}
		}
	]
])
const popover = ref()
const deleteId = ref('')
const showDeleteDialog = ref(false)

const changeLayout = (index: number) => {
	activeLayout.value = index
	
	if (index === 1) {
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
		}
	})
}

onMounted(() => {
	fetchDataPage(1, rowsPerPage.value)
})
</script>

<template>
	<div class="flex flex-col p-6">
		<div class="flex justify-between items-center py-5 z-2 bg-slate-100">
			<h1 class="font-semibold text-xl">{{ t('templates.whatsapp_templates') }}</h1>
			<Button @click="router.push({ name: 'new-template' })">
				<IconPlus size="16" class="mr-2" />
				<span>
					{{ $t('templates.create_new_template') }}
				</span>
			</Button>
		</div>
		<div class="flex gap-3 py-4">
			<div class="relative">
				<IconSearch size="16" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
				<InputText
					v-model="searchTerm"
					class="pl-8! max-w-[300px]"
					name="search"
					id="search"
					fluid
					:placeholder="$t('templates.search_templates')"
					@input="onSearch"
				/>
			</div>

			<ButtonGroup>
				<Button 
					v-for="(option, index) in layoutOptions" 
					:key="index" 
					:variant="activeLayout !== index ? 'outlined' : 'solid'"
					class="py-1.5!"
					@click="changeLayout(index)"
				>
					<component
						:is="option.icon"
						class="w-[20px] h-[20px]"
					/>
					{{ $t(option.label) }}
				</Button>
			</ButtonGroup>
		</div>
		
		<div v-if="activeLayout === 0" class="flex flex-col h-full">
			<DataTable 
				:value="dataPage.data"
				dataKey="id"
				:lazy="true"
				:paginator="true"
				:loading="loading"
				:rows="rowsPerPage"
				:totalRecords="dataPage.meta.total"
				:rowsPerPageOptions="[10, 20, 50]"
				scrollable
  				scrollHeight="flex"
				paginatorTemplate="CurrentPageReport PrevPageLink NextPageLink"
				:currentPageReportTemplate="currentPageReport"
				@page="onPage"
			>
				<template #empty>
					<div class="text-center py-4 text-gray-500">
						{{ $t('template.empty') }}
					</div>
				</template>

				<Column field="name" :header="$t('template.name')" />

				<Column :header="$t('template.message')" :bodyStyle="{ maxWidth: '300px' }" >
					<template #body="{ data }">
						<span class="block whitespace-nowrap overflow-hidden text-ellipsis">
							{{ data.components.body?.content ?? '' }}
						</span>
					</template>
				</Column>

				<Column field="language" :header="$t('template.language_code')">
					<template #body="{ data }">
						{{ data.language.toUpperCase() }}
					</template>
				</Column>

				<Column :header="$t('template.created_at')">
					<template #body="{ data }">
						{{ moment(data.created_at).format('DD/MM/YYYY') }}
					</template>
				</Column>

				<Column field="category" :header="$t('template.category')" />

				<Column :header="$t('template.status')">
					<template #body="{ data }">
						<div class="flex flex-col items-start">
							<StatusBadge :status="data.status" :label="$t(`template_status.${data.status}`)" />
						</div>
					</template>
				</Column>

				<Column>
					<template #body="{ data }">
						<ActionButton @click="(e: Event) => popover?.show(e, data)" />
					</template>
				</Column>
			</DataTable>
		</div>
		<div v-else>
			<TemplateCardList
				:templates="dataPage.data"
				:loading="loading"
				showCreateCard
				:cardProps="{
					options: templateOptions
				}"
				@reach-end="loadNextPage"
			/>
		</div>

		<ActionsPopover ref="popover" :options="templateOptions" />
		<WarningDialog 
			v-model:visible="showDeleteDialog" 
			:title="$t('templates.delete_template')"
			:message="$t('templates.delete_message')"
			:loading="loadingDelete"
			@onConfirm="onDelete"
		/>
	</div>
</template>