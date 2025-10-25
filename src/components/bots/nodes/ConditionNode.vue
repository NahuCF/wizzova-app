<script setup lang="ts">
import { IconMathLower, IconPlus } from '@tabler/icons-vue'
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import { computed, ref, toRaw, watch } from 'vue'
import { useBotStore } from '~/stores'
import type { BotFilterOperator, BotNodeDataMap, ConditionNodeData } from '~/types'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'condition'
    data: BotNodeDataMap['condition']
}>()

defineEmits(['updateNodeInternals'])

const botStore = useBotStore()

const drawerVisible = ref(false)
const variablesPopover = ref()
const showVariableDialog = ref(false)
const newData = ref<ConditionNodeData>({
	conditions: []
})
const conditions = ref<BotFilterOperator[]>([
	'equal', 'not_equal', 'less_than', 'less_than_or_equal', 
	'greater_than', 'greater_than_or_equal', 'is_empty', 'is_not_empty', 'contains'
])
const selectConditionIndex = ref<number | null>(null)

const validConditions = computed(() => {
	const data: ConditionNodeData = props.data
	return data.conditions
		.map(cond  => ({
			...cond,
			variable: botStore.variables.find(v => v.id === cond.variable_id)
		}))
		.filter(cond => cond.operator && cond.value && cond.variable)
})

const onSave = () => {
	props.data.conditions = newData.value.conditions
	drawerVisible.value = false
}

const openVariablesPopover = (event: MouseEvent, conditionIndex: number) => {
	selectConditionIndex.value = conditionIndex
	variablesPopover.value.toggle(event)
}

const addVariable = (variableName: string) => {
	if (selectConditionIndex.value !== null) {
		newData.value.conditions[selectConditionIndex.value].value += `{{${variableName}}`
	}
}

const addCondition = () => {
	newData.value.conditions.push({
		variable_id: '',
		value: ''
	})
}

watch(drawerVisible, (visible) => {
	if (visible) {
		newData.value.conditions = structuredClone(toRaw(props.data.conditions))

		if(newData.value.conditions.length === 0) {
			newData.value.conditions.push({
				variable_id: '',
				value: ''
			})
		}
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconMathLower"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@click="drawerVisible = true"
	>
		<div class="bg-white p-6 flex flex-col gap-2">
			<div
				v-for="(condition, index) in validConditions"
				:key="index"
				class="flex items-center gap-2 p-4 bg-slate-100 rounded-md"
			>
				<div class="flex-1 truncate">
					{{ condition.variable?.name }}
				</div>
				<div class="flex-1 text-white bg-emerald-600 rounded-md px-3 py-1 truncate">
					{{ $t(`bot_workflow.operators.${condition.operator}`) }}
				</div>
				<div class="flex-1 truncate">
					{{ condition.value }}
				</div>
			</div>

			<div class="relative flex items-center gap-2 p-4 bg-slate-100 rounded-md">
				<div>
					{{ $t('bot_workflow.condition.on_success') }}
				</div>
				<Handle
					id="success"
					type="source"
					class="bg-green-600! w-3! h-3!"
					:position="Position.Right"
					:connectable="true"
				/>
			</div>

			<div class="relative flex items-center gap-2 p-4 bg-slate-100 rounded-md">
				<div>
					{{ $t('bot_workflow.condition.on_failure') }}
				</div>
				<Handle
					id="failure"
					type="source"
					class="bg-red-600! w-3! h-3!"
					:position="Position.Right"
					:connectable="true"
				/>
			</div>
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconMathLower"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		@onSave="onSave"
	>
		<div class="bg-white p-6 flex flex-col gap-3 overflow-y-auto overflow-x-hidden">
			<label class="font-medium">
				{{ $t('bot_workflow.condition.conditions') }}
			</label>

			<div
				v-for="(condition, index) in newData.conditions"
				:key="index"
				class="flex flex-col gap-4 p-4 bg-slate-100 rounded-md"
			>
				<div class="flex flex-col gap-2">
					<label class="font-medium">
						{{ $t('bot_workflow.condition.variable') }}
					</label>
					<Select
						:disabled="botStore.variables.length === 0"
						:modelValue="condition.variable_id"
						@change="condition.variable_id = $event.value"
						:options="botStore.variables"
						optionLabel="name"
						optionValue="id"
						:placeholder="$t('bot_workflow.condition.select_variable')"
						class="w-full"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-medium">
						{{ $t('bot_workflow.condition.operator') }}
					</label>
					<Select
						v-model="condition.operator"
						:options="conditions"
						:placeholder="$t('bot_workflow.condition.select_operator')"
						class="w-full"
						name="operator"
						:optionLabel="(data) => $t(`bot_workflow.operators.${data}`)"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<label class="font-medium">
						{{ $t('bot_workflow.condition.value') }}
					</label>
					<InputText 
						v-model="condition.value" 
						:placeholder="$t('bot_workflow.condition.enter_value')" 
						fluid
						id="name"
						name="name"
					/>
					<Button
						severity="info"
						variant="outlined"
						class="self-start !border !border-slate-300 font-bold text-base!"
						size="small"
						@click="openVariablesPopover($event, index)"
					>
						{{ $t('new_template.body.add_variable') }}
					</Button>
				</div>
			</div>

			<div>
				<Button text @click="addCondition">
					<IconPlus size="16" class="inline mr-1" />
					{{ $t('filters.add_condition') }}
				</Button>
			</div>
		</div>
	</BaseNodeDrawer>

	<BotVariableSelect
		ref="variablesPopover"
		@onCreate="showVariableDialog = true"
		@onSelect="addVariable"
	/>

	<BotVariableDialog 
		v-model:visible="showVariableDialog" 
		@onCreated="botStore.variables.push($event)"
	/>
</template>