<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { computed, markRaw, ref } from 'vue'
import { useFlowDragAndDrop } from '~/composables/workflow/useFlowDragAndDrop'
import type { BotEdge, BotNode, BotNodeType } from '~/types'
import StartingNode from '../nodes/StartingNode.vue'
import MessageNode from '../nodes/MessageNode.vue'
import MarkAsSolvedNode from '../nodes/MarkAsSolvedNode.vue'
import AssignChatNode from '../nodes/AssignChatNode.vue'
import ConditionNode from '../nodes/ConditionNode.vue'
import MediaNode from '../nodes/MediaNode.vue'
import QuestionButtonNode from '../nodes/QuestionButtonNode.vue'

const props = defineProps<{
	nodes: BotNode[],
	edges: BotEdge[]
}>()

const { onConnect, addEdges, toObject } = useVueFlow()
const { 
	isDragOver,
	onDragStart,
	onDragOver,
	onDrop,
	onDragLeave,
	addNodeInCenter
} = useFlowDragAndDrop()

const nodeTypes = ref<Record<BotNodeType, any>>({
	starting_node: markRaw(StartingNode),
	message: markRaw(MessageNode),
	template: undefined,
	image: markRaw(MediaNode),
	video: markRaw(MediaNode),
	audio: markRaw(MediaNode),
	document: markRaw(MediaNode),
	question_button: markRaw(QuestionButtonNode),
	condition: markRaw(ConditionNode),
	start_again: undefined,
	mark_as_solved: markRaw(MarkAsSolvedNode),
	assign_chat: markRaw(AssignChatNode),
	location: undefined,
	working_hours: undefined,
	set_variable: undefined
})

const loadedNodes = computed<BotNode[]>(() => {
	return [
		{
			id: 'start',
			position: {
				x: 300,
				y: 300
			},
			type: 'starting_node',
			data: {}
		},
		...props.nodes
	]
})

const normalizeEdges = computed(() => {
	const result =  props.edges.map(edge => {
		const isSuccess = edge.data?.condition_value === '1'
		const isFailure = edge.data?.condition_value === '0'
		const isOption = edge.data?.option_id
		
		let sourceHandle = undefined
		let color = '#64748b'
		if(isSuccess) {
			sourceHandle = 'success'
			color = '#10b981'
		}
		else if(isFailure) {
			sourceHandle = 'failure'
			color = '#ef4444'
		}
		else if(isOption) {
			sourceHandle = edge.data?.option_id
			color = '#047857'
		}
		else if(edge.source) {
			sourceHandle = 'source'
		}

		return {
			...edge,
			targetHandle: edge.target ? 'target' : undefined,
			sourceHandle: sourceHandle,
			data: {
				...edge.data,
			},
			style: {
				stroke: color,
				strokeWidth: 2,
			},
		}
	})

	return result
})

onConnect((params) => {
	const isSuccess = params.sourceHandle === 'success'
	const isFailure = params.sourceHandle === 'failure'
	const isOption = params.sourceHandle && !isSuccess && !isFailure && params.sourceHandle !== 'source'

	let conditionValue = null
	let optionId = undefined
	let color = '#64748b'
	if(isSuccess) {
		conditionValue = true
		color = '#10b981'
	}
	else if(isFailure) {
		conditionValue = false
		color = '#ef4444'
	}
	else if(isOption) {
		optionId = params.sourceHandle
		color = '#047857'
	}

	const edgeData = {
		condition_value: conditionValue,
		option_id: optionId
	}
	
	addEdges([
		{
			...params,
			type: 'smoothstep',
			data: edgeData,
			style: { stroke: color, strokeWidth: 2 }
		}
	])
})

defineExpose({
	save: toObject
})
</script>

<template>
	<div class="w-full h-full flex" @drop="onDrop">
		<BotFlowSidebar @dragStart="onDragStart" @addNode="addNodeInCenter" />

		<VueFlow :node-types="nodeTypes" :nodes="loadedNodes" :edges="normalizeEdges" @dragover="onDragOver" @dragleave="onDragLeave">
			<DropzoneBackground
				class="transition-colors 0.2s ease"
				:class="[isDragOver ? 'bg-emerald-100' : 'bg-transparent']"
			/>
		</VueFlow>
	</div>
</template>