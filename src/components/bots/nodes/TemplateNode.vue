<script setup lang="ts">
import { IconAsterisk, IconTemplate } from '@tabler/icons-vue'
import { type NodeProps } from '@vue-flow/core'
import { computed, ref, watch } from 'vue'
import { useBotStore } from '~/stores'
import { useTemplateStore } from '~/stores/template'
import type { BotNodeDataMap } from '~/types'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'template'
    data: BotNodeDataMap['template']
}>()

defineEmits(['updateNodeInternals'])

const templateStore = useTemplateStore()
const botStore = useBotStore()

const drawerVisible = ref(false)
const newData = ref<{
	templateId: string,
	templateParameters: Record<string, string>
}>({
	templateId: '',
	templateParameters: {}
})
const variablesPopover = ref()
const selectParameterKey = ref<string | null>(null)
const showVariableDialog = ref(false)

const canSave = computed(() => {
	const parametersFilled = Object.values(newData.value.templateParameters).every(value => value.trim() !== '')

	return !!newData.value.templateId && parametersFilled
})

const template = computed(() => templateStore.templates?.find(t => t.id === props.data.template_id))

const selectTemplate = (id: string) => {
	newData.value.templateId = id
	newData.value.templateParameters = {}
	const template = templateStore.templates?.find(t => t.id === id)

	if(template && template.components.body.variables) {
		template.components.body.variables.forEach(variable => {
			newData.value.templateParameters[variable.name] = ''
		})
	}
}

const openVariablesPopover = (event: MouseEvent, parameterKey: string) => {
	selectParameterKey.value = parameterKey
	variablesPopover.value.toggle(event)
}

const addVariable = (variableName: string) => {
	if (selectParameterKey.value !== null) {
		newData.value.templateParameters[selectParameterKey.value] += `{{${variableName}}}`
	}
}

const onSave = () => {
	props.data.template_id = newData.value.templateId,
	props.data.template_parameters = newData.value.templateParameters

	drawerVisible.value = false
}

watch(drawerVisible, (visible) => {
	if (visible) {
		newData.value.templateId = props.data.template_id || ''
		newData.value.templateParameters = props.data.template_parameters || {}
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconTemplate"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@click="drawerVisible = true"
	>
		<div class="flex-basis bg-white p-6 flex flex-col gap-2">
			<span v-if="!template" class="text-gray-400">
				{{ $t('bot_workflow.template.no_template_selected') }}
			</span>
			<div v-else-if="template">
				<MessagePreview 
					:header="!Array.isArray(template?.components.header) ? template.components.header.text : ''" 
					:body="template.components.body.content"
					:footer="template.components.footer"
					:buttons="template.components.buttons"
					minWidth="min-w-[192px]"
					maxWidth="max-w-[250px]"
				/>
			</div>
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconTemplate"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		:disableSave="!canSave"
		@onSave="onSave"
	>
		<div class="bg-white p-6 flex flex-col gap-8 overflow-y-auto overflow-x-hidden">
			<div>
				<div class="flex gap-1 mb-2">
					<h2 class="font-medium text-lg">
						{{ $t('bot_workflow.template.template') }}
					</h2>
				</div>

				<Select
					:modelValue="newData.templateId"
					@change="selectTemplate($event.value)"
					class="w-full"
					:options="templateStore.templates"
					optionValue="id"
					optionLabel="name"
					:loading="templateStore.loading"
					:placeholder="$t('bot_workflow.template.select_template')"
					filter
				/>
			</div>

			<div v-if="Object.entries(newData.templateParameters).length > 0" class="flex flex-col gap-3">
				<h2 class="font-medium text-lg">
					{{ $t('bot_workflow.template.body_variables') }}
				</h2>

				<div
					v-for="([key, value], index) in Object.entries(newData.templateParameters)"
					:key="index"
					class="relative flex flex-col gap-4 p-4 bg-slate-100 rounded-md"
				>
					<div class="flex flex-col gap-2">
						<div class="flex gap-1 mb-2">
							<h2 class="font-medium text-lg">{{ key }}</h2>
							<IconAsterisk color="red" size="8" />
						</div>
						
						<div class="relative">
							<InputText 
								v-model="newData.templateParameters[key]" 
								:placeholder="key" 
								fluid
								:id="`variable${index}`"
								:name="`variable${index}`"
								:maxlength="1024"
								class="!pr-[6rem]" 
							/>
							<div class="absolute right-3 top-2 text-slate-400">
								{{ value?.length || 0 }} / 1024
							</div>
						</div>

						<Button
							severity="info"
							variant="outlined"
							class="self-start !border !border-slate-300 font-bold text-base!"
							size="small"
							@click="openVariablesPopover($event, key)"
						>
							{{ $t('new_template.body.add_variable') }}
						</Button>
					</div>
				</div>
			</div>
		</div>

		<BotVariableSelect
			ref="variablesPopover"
			@onCreate="showVariableDialog = true"
			@onSelect="addVariable"
		/>

		<BotVariableDialog 
			v-model:visible="showVariableDialog" 
			@onCreated="botStore.variables.push($event)"
		/>
	</BaseNodeDrawer>
</template>