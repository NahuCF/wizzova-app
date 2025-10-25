<script setup lang="ts">
import { IconCheck } from '@tabler/icons-vue'
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import type { BotNodeDataMap } from '~/types'

defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'mark_as_solved'
    data: BotNodeDataMap['mark_as_solved']
}>()

defineEmits(['updateNodeInternals'])
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconCheck"
		:title="$t(`bot_workflow.nodes.${type}`)"
		hideEdit
	>
		<template #handles>
			<Handle type="target" :position="Position.Left" :connectable="true" />
		</template>
	</BaseNode>
</template>