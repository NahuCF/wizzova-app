<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { IconAsterisk, IconBold, IconItalic, IconStrikethrough } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { useTextareaSelection } from '~/composables/useTextareaSelection'
import { useBotStore } from '~/stores'

const props = defineProps<{
	modelValue: string
	title?: string
	placeholder?: string
	maxLength?: number
	minHeightClass?: string,
	optional?: boolean
}>()

const emit = defineEmits<{
	(e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()
const botStore = useBotStore()

const message = ref(props.modelValue)
const messageRef = ref()
const variablesPopover = ref()
const showVariableDialog = ref(false)

const { wrapSelection } = useTextareaSelection(messageRef, message)

const selectionFormatters = [
	{
		label: t('new_template.body.format.bold'),
		icon: IconBold,
		handler: () => wrapSelection('*', '*'),
	},
	{
		label: t('new_template.body.format.italic'),
		icon: IconItalic,
		handler: () => wrapSelection('_', '_'),
	},
	{
		label: t('new_template.body.format.strikethrough'),
		icon: IconStrikethrough,
		handler: () => wrapSelection('~', '~'),
	},
]

watch(message, (val) => emit('update:modelValue', val))
watch(
	() => props.modelValue,
	(val) => {
		if (val !== message.value) message.value = val
	}
)

const formatMessage = (value: string) => {
	const formattedText = value.replace(/{{(.*?)}}/g, (_match, variableName) => {
		const name = variableName.replace(/[^a-zA-Z0-9.]/g, '_')
		return `{{${name}}}`
	})
	message.value = formattedText
}

const onMessageInput = (event: Event) => {
	const target = event.target as HTMLInputElement | null
	if (target) formatMessage(target.value)
}

const openVariablesPopover = (event: MouseEvent) => {
	variablesPopover.value?.toggle(event)
}

const insertVariable = (variable: string) => {
	wrapSelection('{{' + variable + '}}')
	formatMessage(message.value)
	variablesPopover.value?.hide()
}

const minHeight = computed(() => props.minHeightClass || 'min-h-[12rem]')
</script>

<template>
	<div>
		<div class="flex gap-1 mb-2">
			<h2 class="font-medium text-lg">{{ title || t('bot_workflow.message_label') }}</h2>
			<span v-if="optional" class="text-lg">({{ $t('optional') }})</span>
			<IconAsterisk v-else color="red" class="mt-1" size="8" />
		</div>

		<div class="flex flex-col gap-1 relative mb-2">
			<div class="relative">
				<Textarea
					ref="messageRef"
					v-model="message"
					rows="4"
					cols="30"
					fluid
					:maxlength="maxLength || 4096"
					class="text-lg! w-full" :class="minHeight"
					:placeholder="placeholder || t('bot_workflow.message_placeholder')"
					@input="onMessageInput"
				/>
				<div class="absolute right-3 bottom-2 text-slate-400">
					{{ message.length }} / {{ maxLength || 4096 }}
				</div>
			</div>
		</div>

		<div class="flex gap-3">
			<Button severity="info" variant="outlined" class="self-start !border !border-slate-300 font-bold text-base!"
				size="small" @click="openVariablesPopover">
				{{ t('new_template.body.add_variable') }}
			</Button>

			<div class="flex items-center gap-3">
				<div v-for="({ label, icon: Icon, handler }, idx) in selectionFormatters" :key="idx"
					class="p-1.5 cursor-pointer hover:bg-slate-100 rounded-full" :title="label" @click="handler">
					<component :is="Icon" class="text-slate-700" size="13" />
				</div>
			</div>
		</div>

		<BotVariableSelect ref="variablesPopover" @onSelect="insertVariable" @onCreate="showVariableDialog = true" />

		<BotVariableDialog v-model:visible="showVariableDialog" @onCreated="botStore.variables.push($event)" />
	</div>
</template>
