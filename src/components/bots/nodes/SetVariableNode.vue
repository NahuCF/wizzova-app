<script setup lang="ts">
import { IconVariable, IconPlus, IconTrash } from '@tabler/icons-vue'
import { type NodeProps, useVueFlow } from '@vue-flow/core'
import { computed, onMounted, ref, toRaw, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBotStore } from '~/stores'
import type { BotNodeDataMap } from '~/types'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'set_variable'
    data: BotNodeDataMap['set_variable']
}>()

const emit = defineEmits(['updateNodeInternals'])
const { updateNodeData } = useVueFlow()

const botStore = useBotStore()
const { t } = useI18n()

const drawerVisible = ref(false)
const showVariableDialog = ref(false)
const newData = ref<BotNodeDataMap['set_variable']>({
	variables: []
})

onMounted(() => {
	if (props.data.__isNew) {
		drawerVisible.value = true
	}
})

const validVariables = computed(() => {
	if (!props.data.variables || !Array.isArray(props.data.variables)) {
		return []
	}
	return props.data.variables
		.filter(v => v.variable_name && v.value)
		.map(v => ({
			...v,
			variable: botStore.variables.find(bv => bv.name === v.variable_name)
		}))
})

const onSave = () => {
	// Use updateNodeData to avoid prop mutation
	const filteredVariables = newData.value.variables.filter(v => v.variable_name && v.value)
	updateNodeData(props.id, { 
		...props.data,
		variables: filteredVariables 
	})
	drawerVisible.value = false
}

const addVariable = () => {
	newData.value.variables.push({
		variable_name: '',
		value: ''
	})
}

const removeVariable = (index: number) => {
	newData.value.variables = newData.value.variables.filter((_, i) => i !== index)
}

const handleVariableSelect = (index: number, value: string) => {
	if (value === '__create_new__') {
		showVariableDialog.value = true
		// Reset the select to empty
		newData.value.variables[index].variable_name = ''
	} else {
		newData.value.variables[index].variable_name = value
	}
}

watch(drawerVisible, (visible) => {
	if (visible) {
		// Initialize with empty array if variables don't exist
		if (!props.data.variables || !Array.isArray(props.data.variables)) {
			newData.value.variables = [{
				variable_name: '',
				value: ''
			}]
		} else {
			// Use JSON parse/stringify for deep cloning to avoid DataCloneError
			newData.value.variables = JSON.parse(JSON.stringify(toRaw(props.data.variables)))
			
			if(newData.value.variables.length === 0) {
				newData.value.variables.push({
					variable_name: '',
					value: ''
				})
			}
		}
	}
})

// Computed property for variable options including "Create variable" option
const variableOptions = computed(() => {
	return [
		{ name: t('bot_workflow.create_variable'), value: '__create_new__', isSpecial: true },
		...botStore.variables.map(v => ({ name: v.name, value: v.name }))
	]
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconVariable"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
	>
		<div class="flex-basis bg-white p-6 flex flex-col gap-2">
			<div
				v-for="(variable, index) in validVariables"
				:key="index"
				class="flex items-center gap-2 p-3 bg-slate-100 rounded-md"
			>
				<div class="flex-1 truncate font-medium">
					{{ variable.variable?.name || variable.variable_name }}
				</div>
				<div class="text-emerald-600">=</div>
				<div class="flex-1 truncate text-gray-600">
					{{ variable.value }}
				</div>
			</div>
			
			<div v-if="validVariables.length === 0" class="text-gray-400 italic">
				{{ $t('bot_workflow.set_variable.no_variables_configured') }}
			</div>
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconVariable"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		:disableSave="newData.variables.length === 0 || newData.variables.every(v => !v.variable_name || !v.value)"
		@onSave="onSave"
	>
		<div class="bg-white p-6 flex flex-col gap-3 overflow-y-auto overflow-x-hidden">
			<h2 class="font-medium text-lg">
				{{ $t('bot_workflow.set_variable.variables') }}
			</h2>

			<div
				v-for="(variable, index) in newData.variables"
				:key="index"
				class="relative flex flex-col gap-4 p-4 bg-slate-100 rounded-md"
			>
				<div class="flex flex-col gap-2">
					<label class="font-medium">
						{{ $t('bot_workflow.set_variable.variable') }}
						<span class="text-red-500">*</span>
					</label>
					<Select
						:modelValue="variable.variable_name"
						@update:modelValue="handleVariableSelect(index, $event)"
						:options="variableOptions"
						optionLabel="name"
						optionValue="value"
						:placeholder="$t('bot_workflow.set_variable.select_variable')"
						class="w-full"
					>
						<template #option="slotProps">
							<div 
								:class="[
									slotProps.option.isSpecial ? 'font-semibold text-emerald-600' : '',
									'py-2'
								]"
							>
								{{ slotProps.option.name }}
							</div>
						</template>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-medium">
						{{ $t('bot_workflow.set_variable.value') }}
						<span class="text-red-500">*</span>
					</label>
					<InputText 
						v-model="variable.value" 
						:placeholder="$t('bot_workflow.set_variable.enter_value')" 
						fluid
					/>
				</div>

				<IconTrash
					v-if="newData.variables.length > 1"
					class="absolute top-3 right-3 cursor-pointer text-red-600 hover:text-red-800"
					size="16"
					@click="removeVariable(index)"
				/>
			</div>

			<div>
				<Button text @click="addVariable">
					<IconPlus size="16" class="inline mr-1" />
					{{ $t('bot_workflow.set_variable.add_variable') }}
				</Button>
			</div>
		</div>
	</BaseNodeDrawer>

	<BotVariableDialog 
		v-model:visible="showVariableDialog" 
		@onCreated="botStore.variables.push($event)"
	/>
</template>