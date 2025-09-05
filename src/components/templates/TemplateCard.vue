<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconCheck, IconBrandWhatsappFilled } from '@tabler/icons-vue'
import type { WABANumber, TemplateItem, ActionGenerator } from '~/types'
import moment from 'moment'

const props = defineProps<{
	template: TemplateItem,
	actions?: ActionGenerator<TemplateItem>,
	clickable?: boolean,
	broadcastNumber?: WABANumber
}>()

const emit = defineEmits<{
  	(e: 'click', template: TemplateItem): void
}>()


const popover = ref()

const headerText = computed(() => {
	if(!Array.isArray(props.template.components.header)) {
		return props.template.components.header.text
	}
	
	return ''
})

const onClick = () => {
	if (props.clickable) {
		emit('click', props.template)
	}
}
</script>

<template>
	<div 
		class="group relative flex flex-col justify-between rounded-md border-2 border-slate-200 bg-slate-100 w-full transition-all duration-150"
		:class="{
			'hover:border-emerald-500 hover:bg-slate-50 hover:shadow cursor-pointer': clickable,
			'cursor-default': !clickable
		}"
		@click="onClick"
	>
		<div
			class="absolute top-2 right-2 opacity-0 group-hover:opacity-50 transition-opacity duration-200 rounded-full bg-emerald-500 p-1"
			v-if="clickable"
		>
			<IconCheck class="text-white" size="22" />
		</div>

		<!-- HEADER -->
		<div class="flex flex-col gap-2 w-full p-2 bg-slate-200 rounded-t-md">
			<div class="flex justify-between items-center">
				<div class="flex flex-col">
					<h3 class="text-lg font-semibold mb-2">{{ template.name }}</h3>
					<div class="flex items-center gap-2">
						<StatusBadge :status="template.status" :label="$t(`template_status.${template.status}`)" />
						<div class="text-base font-normal text-slate-500">
							{{ template.category }}
						</div>
					</div>
				</div>
				<div v-if="actions && actions(template).length > 0" class="flex">
					<ActionButton @click="(e: Event) => popover?.show(e, template)" />
				</div>
				

				<ActionsPopover v-if="actions && actions(template).length > 0" ref="popover" :actions="actions" />
			</div>
			<div v-if="broadcastNumber" class="flex items-center gap-2">
				<div>
					<IconBrandWhatsappFilled size="13" />
				</div>
				<div class="text-base font-light text-slate-500">
					{{ broadcastNumber.verified_name }} || {{ broadcastNumber.display_phone_number }}
				</div>
			</div>
		</div>

		<!-- MESSAGE TEMPLATE -->
		<div class="mt-3 mb-2 px-6 pt-3 pb-5 overflow-y-auto overflow-x-hidden h-100">
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
		<div class="flex justify-between items-center p-2 bg-slate-200 rounded-b-md">
			<div class="bg-slate-100 px-2 py-1 rounded-lg text-base font-medium leading-none">
				{{ template.language }}
			</div>
			<div 
				class="text-base font-normal text-slate-500" 
				v-tooltip.bottom="{
					value: moment(template.created_at).format('DD/MM/YYYY HH:mm'),
					class: 'text-base'
				}"
			>
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