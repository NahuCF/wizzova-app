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
	image: undefined,
	video: undefined,
	audio: undefined,
	document: undefined,
	question_button: undefined,
	condition: undefined,
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

onConnect(addEdges)

defineExpose({
	save: toObject
})
</script>

<template>
	<div class="w-full h-full flex" @drop="onDrop">
		<BotFlowSidebar @dragStart="onDragStart" @addNode="addNodeInCenter" />

		<VueFlow :node-types="nodeTypes" :nodes="loadedNodes" :edges="edges" @dragover="onDragOver" @dragleave="onDragLeave">
			<DropzoneBackground
				class="transition-colors 0.2s ease"
				:class="[isDragOver ? 'bg-emerald-100' : 'bg-transparent']"
			/>
		</VueFlow>
	</div>
</template>