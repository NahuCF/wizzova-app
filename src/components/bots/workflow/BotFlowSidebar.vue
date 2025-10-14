<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue';
import { nodeTypes, useFlowDragAndDrop, type BotNodeCategory } from '~/composables/workflow/useFlowDragAndDrop'

const { onDragStart } = useFlowDragAndDrop()

const categories: BotNodeCategory[] = ['send_message', 'question', 'general']
</script>

<template>
	<aside class="max-w-[400px] w-full bg-white p-6 flex flex-col gap-4">
		<div v-for="category in categories" :key="category" class="flex flex-col gap-4">
			<div class="text-lg text-slate-700 uppercase">{{ category }}</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div
					v-for="nodeType in nodeTypes.filter(n => n.category === category)"
					:key="nodeType.name"
					class="relative flex flex-col gap-2 items-center justify-between border-2 rounded-lg py-4"
					:class="{
						'border-slate-100': !nodeType.isPremium,
						'border-amber-300': nodeType.isPremium,
						'cursor-grab': !nodeType.isPremium,
						'cursor-pointer': nodeType.isPremium
					}"
					:draggable="!nodeType.isPremium"
					@dragstart="onDragStart($event, nodeType.name)"
				>
					<component class="text-emerald-500" :is="nodeType.icon" size="32" />
					<IconCrown v-if="nodeType.isPremium" class="absolute top-0 right-1 text-amber-300" size="18" />
					<div class="text-slate-500">{{ nodeType.name }}</div>
				</div>
			</div>
		</div>
	</aside>
</template>