<script setup lang="ts">
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import type { BotNodeDataMap } from '~/types'

defineProps<NodeProps & {
    id: string
    position: {
        x: number
        y: number
    }
    type: 'message'
    data: BotNodeDataMap['message']
}>()

defineEmits(['updateNodeInternals'])
</script>

<template>
	<div
		:id="id"
		class="bg-white p-6 rounded-md text-emerald-500 border-2 border-emerald-500"
	>
		{{ data.content }}
	</div>

	<Handle type="target" :position="Position.Left" :connectable="true" />
</template>