<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IconSearch, IconPlus } from '@tabler/icons-vue'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { TemplateItem } from '~/types'

defineProps<{
    visible: boolean,
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const {
    dataPage,
    loading,
    searchTerm,
    fetchDataPage,
    loadNextPage,
    debouncedFetch,
} = usePaginatedData<TemplateItem>(
    (page, perPage, search) => API.template.index({ page, name: search, perPage, status: 'APPROVED' })
        .then(res => res.data),
    12
)
const router = useRouter()

const currentStep = ref(1)
const selectedTemplate = ref<TemplateItem>()

const onTemplateSelected = (template: TemplateItem) => {
	selectedTemplate.value = template
	currentStep.value++
}

fetchDataPage(1)
</script>

<template>
	<Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)"
        modal
        :draggable="false"
        :header="$t('new_broadcast.select_template')"
        class="min-w-[25rem] max-w-[1088px] w-full min-h-[500px]"
    >
		<div class="flex flex-col justify-center pb-6">
			<div class="flex gap-2">
				<div class="relative">
					<IconSearch size="16" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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

				<Button 
					@click="router.push({ 
						name: 'new-template', 
						query: { redirectTo: 'new-broadcast' }
					})"
				>
					<IconPlus size="16" class="mr-1" />
					<span>
						{{ $t('new_broadcast.add_template') }}
					</span>
				</Button>
			</div>
		</div>

		<div 
			v-if="dataPage.data.length === 0 && !loading"
			class="flex flex-col justify-center items-center py-30 gap-10"
		>
			<div class="text-3xl font-semibold text-center max-w-[500px] leading-10">
				{{ $t('new_broadcast.missing_template_title') }}
			</div>
			<div class="text-2xl font-medium text-gray-400 text-center max-w-[500px] leading-10">
				{{ $t('new_broadcast.missing_template_description') }}
			</div>
			<Button
				@click="router.push({ 
					name: 'new-template', 
					query: { redirectTo: 'new-broadcast' }
				})"
			>
				<span class="text">
					{{ $t('new_broadcast.add_template') }}
				</span>
			</Button>
		</div>

		<TemplateCardList
			v-else
			:templates="dataPage.data"
			:loading="loading"
			:cardProps="{
				clickable: true
			}"
			@reach-end="loadNextPage"
			@select="onTemplateSelected"
		/>
	</Dialog>
</template>