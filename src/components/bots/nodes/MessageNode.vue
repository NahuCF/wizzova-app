<script setup lang="ts">
import { IconMessage, IconAsterisk, IconBold, IconItalic, IconStrikethrough } from '@tabler/icons-vue'
import { type NodeProps } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTextareaSelection } from '~/composables/useTextareaSelection'
import { useTextFormatter } from '~/composables/useTextFormatter'
import { useBotStore, useContactFieldStore } from '~/stores'
import type { BotNodeDataMap } from '~/types'

const props = defineProps<NodeProps & {
    id: string
    position: {
        x: number
        y: number
    }
    type: 'message'
    data: BotNodeDataMap['message']
}>()

defineEmits(['updateNodeInternals'])

const { t } = useI18n()
const { getPreviewText } = useTextFormatter()
const contactFieldStore = useContactFieldStore()
const botStore = useBotStore()

const drawerVisible = ref(false)
const showVariableDialog = ref(false)
const variablesPopover = ref()
const messageRef = ref()
const message = ref('')
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
	}
]

const onSave = () => {
	props.data.content = message.value
	drawerVisible.value = false
}

const onMessageInput = (event: Event) => {
	const target = event.target as HTMLInputElement | null

	if(target) {
		formatMessage(target.value)
	}
}

const formatMessage = (value: string) => {
	const formattedText = value.replace(/{{(.*?)}}/g, (_match, variableName) => {
		const name = variableName.replace(/[^a-zA-Z0-9.]/g, '_')
		return `{{${name}}}`
	})

	message.value = formattedText
}

const openVariablesPopover = (event: MouseEvent) => {
	variablesPopover.value.toggle(event)
}

const insertVariable = (variable: string) => {
	wrapSelection('{{' + variable + '}}')
	formatMessage(message.value)

	variablesPopover.value?.hide()
}

watch(drawerVisible, (visible) => {
	if (visible) {
		message.value = props.data.content
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconMessage"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@click="drawerVisible = true"
	>
		<span
			:id="id"
			class="bg-white p-6 text-gray-500"
			v-html="getPreviewText(data.content)"
		>
		</span>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconMessage"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		@onSave="onSave"
	>
		<div class="p-6">
			<div class="flex gap-1 mb-2">
				<h2 class="font-medium">{{ $t('bot_workflow.message_label') }}</h2>
				<IconAsterisk color="red" class="mt-1" size="8" />
			</div>

			<div class="flex flex-col gap-1 relative mb-2">
				<div class="relative">
					<Textarea 
						ref="messageRef"
						v-model="message" 
						rows="4" 
						cols="30" 
						fluid 
						class="text-lg! min-h-[12rem]"
						:maxlength="4096"
						@input="onMessageInput"
						:placeholder="$t('bot_workflow.message_placeholder')"
					/>
					<div class="absolute right-3 bottom-2 text-slate-400">
						{{ message.length }} / 4096
					</div>
				</div>
			</div>
			
			<div class="flex gap-3">
				<Button
					severity="info"
					variant="outlined"
					class="self-start !border !border-slate-300 font-bold text-base!"
					size="small"
					@click="openVariablesPopover"
				>
					{{ t('new_template.body.add_variable') }}
				</Button>

				<div class="flex items-center gap-3">
					<div
						v-for="({ label, icon: Icon, handler }, idx) in selectionFormatters"
						:key="idx"
						class="p-1.5 cursor-pointer hover:bg-slate-100 rounded-full"
						:title="label"
						@click="handler"
					>
						<component :is="Icon" class="text-slate-700" size="13" />
					</div>
				</div>
			</div>

			<Popover ref="variablesPopover">
				<div class="pt-4 pb-2 min-w-[15rem] max-h-[300px] overflow-y-auto overflow-x-hidden">
					<li 
						class="py-2 px-3 hover:bg-slate-100 cursor-pointer" 
						@click="showVariableDialog = true"
					>
						{{ $t('bot_workflow.create_variable') }}
					</li>

					<div v-if="botStore.variables.length > 0" class="font-semibold px-4 my-2">
						{{ t('bot_workflow.bot_variables') }}
					</div>
					<ul class="list-none p-0 m-0 flex flex-col">
						<li 
							v-for="variable in botStore.variables" 
							:key="`default_${variable}`"
							class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
							@click="insertVariable(variable.name)"
						>
							{{ variable.name }}
						</li>
					</ul>

					<div v-if="contactFieldStore.contactFields.length > 0" class="font-semibold px-4 my-2">
						{{ t('bot_workflow.contact_fields') }}
					</div>
					<ul class="list-none p-0 m-0 flex flex-col">
						<li 
							v-for="variable in contactFieldStore.contactFields" 
							:key="`default_${variable}`"
							class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
							@click="insertVariable(`contact.${variable.name}`)"
						>
							{{ variable.name }}
						</li>
					</ul>
				</div>
			</Popover>

			<BotVariableDialog 
				v-model:visible="showVariableDialog" 
				@onCreated="botStore.variables.push($event)"
			/>
		</div>
	</BaseNodeDrawer>
</template>