<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { ref } from 'vue'
import { useFlowDragAndDrop } from '~/composables/workflow/useFlowDragAndDrop'

const { onConnect, addEdges } = useVueFlow()
const { isDragOver, onDragOver, onDrop, onDragLeave } = useFlowDragAndDrop()

const nodes = ref([])

onConnect(addEdges)
</script>

<template>
	<div class="w-full h-[100vh] flex" @drop="onDrop">
		<VueFlow :nodes="nodes" @dragover="onDragOver" @dragleave="onDragLeave">
			<DropzoneBackground
				class="transition-colors 0.2s ease"
				:class="[isDragOver ? 'bg-emerald-100' : 'bg-transparent']"
			>
				<p v-if="isDragOver">Drop here</p>
			</DropzoneBackground>
		</VueFlow>

		<BotFlowSidebar />
	</div>
</template>