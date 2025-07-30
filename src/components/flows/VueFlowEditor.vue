<script setup lang="ts">
import { computed, markRaw, onMounted, nextTick, ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import type { TestNode, TestEdge } from '~/composables/useTestBotFlow'
import VueFlowNodeAdapter from './VueFlowNodeAdapter.vue'
import '@vue-flow/core/dist/style.css'

const nodeTypes = ref({ custom: markRaw(VueFlowNodeAdapter) })

const props = defineProps<{ nodes: TestNode[]; edges: TestEdge[] }>()

const rfNodes = computed(() =>
	props.nodes.map(node => ({
		...node,
		type: 'custom',
		data: { label: node.label },
	}))
)

const rfEdges = computed(() =>
	props.edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: 'smoothstep',
		animated: true,
		style: { stroke: '#6c63ff', strokeWidth: 2 }
	}))
)

onMounted(async () => {
	const start = performance.now()

	await nextTick()
	await new Promise(requestAnimationFrame)

	const renderedNodes = document.querySelectorAll('.vue-flow__node').length
	const renderedEdges = document.querySelectorAll('.vue-flow__edge-path').length

	const end = performance.now()
	console.log(
		`[VueFlow] Rendered ${renderedNodes} nodes and ${renderedEdges} edges in ${(end - start).toFixed(2)}ms`
	)
})

</script>

<template>
	<VueFlow
		:nodes="rfNodes"
		:edges="rfEdges"
		fit-view
		:minZoom="0.1"
		:maxZoom="2"
		:node-types="nodeTypes"
		:fitViewOptions="{ padding: 0.2, maxZoom: 2, minZoom: 0.1 }"
		class="h-[600px] border rounded"
	/>
</template>