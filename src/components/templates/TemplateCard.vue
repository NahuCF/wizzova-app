<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconDotsVertical } from '@tabler/icons-vue'
import type { DropdownOption, TemplateItem } from '~/types'
import moment from 'moment'
import ActionsPopover from '../ActionsPopover.vue';

const props = defineProps<{
	template: TemplateItem,
	options: DropdownOption[][]
}>()

const popover = ref()

const headerText = computed(() => {
	if(!Array.isArray(props.template.components.header)) {
		return props.template.components.header.text
	}
	
	return ''
})
</script>

<template>
	<div class="flex flex-col justify-between rounded-md border-2 border-slate-200 bg-slate-100 w-full">
		<!-- HEADER -->
		<div class="flex justify-between items-center p-2 bg-slate-200">
			<div class="flex flex-col">
				<h3 class="text-md font-semibold mb-2">{{ template.name }}</h3>
				<div class="flex items-center gap-2">
					<StatusBadge :status="template.status" :label="$t(`template_status.${template.status}`)" />
					<div class="text-sm font-normal text-slate-500">
						{{ template.category }}
					</div>
				</div>
			</div>
			<div class="flex">
				<Button
					class="bg-white! hover:bg-slate-200! p-1! border-1! border-slate-300! font-semibold! text-slate-500!"
					@click="(e) => popover?.show(e, template)"
				>
					<IconDotsVertical size="13"  />
				</Button>
			</div>

			<ActionsPopover ref="popover" :options="options" />
		</div>

		<!-- MESSAGE TEMPLATE -->
		<div class="mt-3 mb-2 pl-6 pt-3 pb-5 overflow-y-scroll overflow-x-hidden h-100">
			<MessagePreview 
				:header="headerText" 
				:body="template.components.body.content"
				:footer="template.components.footer" 
				:buttons="template.components.buttons" 
				minWidth="min-w-[192px]"
				maxWidth="max-w-[250px]"
			/>
		</div>

		<!-- FOOTER -->
		<div class="flex justify-between items-center p-2 bg-slate-200">
			<div class="bg-slate-100 px-2 py-1 rounded-lg text-sm font-medium leading-none">
				{{ template.language }}
			</div>
			<div class="text-sm font-normal text-slate-500" v-tooltip.bottom="moment(template.created_at).format('DD/MM/YYYY HH:mm')">
				{{ moment(template.created_at).format('DD/MM/YYYY') }}
			</div>
		</div>
	</div>
</template>

<style scoped>
.message {
  z-index: 100;
}
</style>