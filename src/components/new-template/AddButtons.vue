<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import {
	IconPhone,
	IconPlus,
	IconGripVertical,
	IconArrowBackUp,
	IconExternalLink,
	IconSwitchVertical,
} from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import draggable from 'vuedraggable'
import type { TemplateButton, TemplateButtonOption, TemplateButtonsByCategory, TemplateQuickReplyOption } from '~/types'

const props = defineProps<{
	buttons: TemplateButton[]
}>()


const emit = defineEmits<{
  	(e: 'update:buttons', buttons: TemplateButton[]): void
}>()

const { t } = useI18n()

const popoverButton = ref()
const ctaButtonOptions = ref<TemplateButtonOption[]>([
	{
		id: 'url',
		type: 'STATIC_URL',
		category: 'cta',
		name: 'URL',
		icon: 'IconExternalLink',
		description: 'max_2_buttons',
		maximun: 2,
	},
	{
		id: 'ctn',
		type: 'PHONE_NUMBER',
		category: 'cta',
		name: 'call_to_number',
		icon: 'IconPhone',
		description: 'max_1_buttons',
		maximun: 1,
	},
])
const iconComponents: Record<string, Component> = { IconExternalLink, IconPhone, IconArrowBackUp }
const tooltipContent = ref(
	`<strong class="font-semibold break-keep whitespace-nowrap">${t('button_limit_reached')}</strong>
    <span class="text-slate-200">${t('first_delete_a_button')}</span>`,
)
const dragOptions = ref({
	animation: 200,
	ghostClass: 'dragging',
	revertOnSpill: true,
})

const canAddMoreButtons = computed(() => {
	return props.buttons.length < 10
})

const buttonsByCategory = computed<TemplateButtonsByCategory>(() => {
	return props.buttons.reduce((acc, item) => {
		acc[item.category] = acc[item.category] || []
		acc[item.category].push(item)
		return acc
	}, {} as TemplateButtonsByCategory)
})

const addButton = (option: TemplateButtonOption | TemplateQuickReplyOption) => {
	if (!canAddButton(option.type, option.maximun)) return

	const isUrlType = option.type === 'DYNAMIC_URL' || option.type === 'STATIC_URL'
	const isCallType = option.type === 'PHONE_NUMBER'

	const newButton = {
		type: option.type,
		text: '',
		category: option.category,
		...(isUrlType && { url: '' }),
		...(isCallType && { phone_number: '' }),
		...(isCallType && { phone_number_prefix: '' })
	}
	emit('update:buttons', [...props.buttons, newButton])

	popoverButton.value.hide()
}

const openPopoverButton = (event: MouseEvent) => {
	popoverButton.value.toggle(event)
}

const canAddButton = (btnType: string, max: number) => {
	const buttonsOfType = props.buttons.filter((btn) => btn.type === btnType)

	return buttonsOfType.length < max
}

const switchCategoryOrder = (category: string) => {
	const categories = Object.keys(buttonsByCategory.value)
	const index = categories.indexOf(category)
	if (index === -1) return

	const nextIndex = (index + 1) % categories.length

	const newOrder = [...categories]
	const temp = newOrder[index]
	newOrder[index] = newOrder[nextIndex]
	newOrder[nextIndex] = temp

	const reordered = newOrder
		.map((cat) => buttonsByCategory.value[cat])
		.flat()

	emit('update:buttons', reordered)
}

const onDragEnd = (category: string, event: any) => {
	const currentButtons = buttonsByCategory.value[category]
	const otherButtons = Object.entries(buttonsByCategory.value)
		.filter(([key]) => key !== category)
		.flatMap(([, btns]) => btns)

	const reordered = [...otherButtons, ...currentButtons]

	emit('update:buttons', reordered)
}

const removeButton = (toRemove: TemplateButton) => {
	const newButtons = props.buttons.filter((btn) => btn !== toRemove)
	emit('update:buttons', newButtons)
}
</script>

<template>
	<div>
		<div class="flex flex-col gap-1">
			<h2 class="font-medium text-lg">{{ $t('buttons') }}</h2>

			<p class="text-slate-500 text-sm">{{ t('help_text_buttons') }}</p>

			<Button 
				severity="secondary" 
				@click="openPopoverButton" 
				class="self-start !border !border-slate-300 my-4"
				:disabled="buttons.length >= 10" 
				v-tooltip:bottom="{
					value: canAddMoreButtons ? '' : tooltipContent,
					escape: false,
					class: 'custom-tooltip',
				}"
			>
				<IconPlus size="16" class="mr-2" />
				{{ t('add_button') }}
			</Button>

			<div class="flex flex-col gap-2">
				<div v-for="(buttons, category) in buttonsByCategory" :key="category">
					<div class="bg-[#F7FAFC] p-4 rounded-md">
						<div class="flex gap-2 items-center font-medium">
							<button
								class="p-2 hover:cursor-pointer hover:bg-slate-200 transition rounded-md text-slate-600"
								@click="switchCategoryOrder(category)">
								<IconSwitchVertical class="w-5 h-5" />
							</button>
							<h3>{{ t(category) }}</h3>
						</div>
						<draggable
							:list="buttons"
							@end="onDragEnd(category, $event)"
							:group="{ name: category, pull: false, put: false }" 
							:sort="true" 
							item-key="id"
							handle=".drag-handle" class="mt-8 flex flex-col gap-2"
							v-bind="dragOptions"
						>
							<template #item="{ element }">
								<div class="drag-handle flex gap-2">
									<IconGripVertical class="text-slate-400 hover:cursor-grab mt-4" />
									<TemplateButton 
										class="w-full" 
										:button="element"
										@remove="removeButton(element)"
									/>
								</div>
							</template>
						</draggable>
					</div>
				</div>
			</div>

			<Popover ref="popoverButton">
				<div class="p-3 min-w-[15rem]">
					<div class="font-semibold mb-2">{{ t('quick_answer_buttons') }}</div>
					<ul class="list-none p-0 m-0 flex flex-col">
						<li 
							:class="[
								'flex items-center gap-2 px-2 py-3 hover:bg-slate-100 cursor-pointer rounded-border',
								{
									'opacity-50 cursor-not-allowed ': !canAddMoreButtons,
								},
							]" 
							@click="
								addButton({
									id: 'qr',
									type: 'QUICK_REPLY',
									maximun: 999,
									category: 'custom_reply',
									icon: 'IconArrowBackUp',
									text: 'text',
								})
							"
						>
							<div class="flex gap-1">
								<IconArrowBackUp size="18" />
								<span>
									{{ t('custom_reply') }}
								</span>
							</div>
						</li>
					</ul>
					<Divider />
					<div class="font-semibold mb-2">{{ t('cto_button') }}</div>
					<ul class="list-none p-0 m-0 flex flex-col">
						<li 
							v-for="option in ctaButtonOptions" 
							:key="option.id" 
							:class="[
								'flex items-center gap-2 px-2 py-3 hover:bg-slate-100 cursor-pointer rounded-border',
								{
									'opacity-50 !cursor-not-allowed ': !canAddButton(option.type, option.maximun),
								},
							]" 
							@click="addButton(option)"
						>
							<div class="flex gap-1">
								<component :is="iconComponents[option.icon]" size="18" />
								<div>
									<p v-if="option.name">
										{{ t(option.name) }}
									</p>
									<p v-if="option.description" class="text-slate-400 text-sm">
										{{ t(option.description) }}
									</p>
								</div>
							</div>
						</li>
					</ul>
				</div>
			</Popover>
		</div>
	</div>
</template>

<style>
.draggable-item {
	transition: transform 0.2s ease-in-out;
}
</style>
