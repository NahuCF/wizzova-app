<script setup lang="ts">
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import { IconPlayerPlayFilled } from '@tabler/icons-vue'
import type { BotNode } from '~/types'

type StartingNode = Extract<BotNode, { type: 'starting_node' }>

defineProps<NodeProps<StartingNode>>()

defineEmits(['updateNodeInternals'])
</script>

<template>
	<div
		:id="id"
		class="bg-white p-6 rounded-md text-emerald-500 border-2 border-emerald-500 cursor-pointer"
		@click="() => {}"
	>
		<IconPlayerPlayFilled size="64" />
	</div>

	<Handle type="source" :position="Position.Right" :connectable="true" />
</template>