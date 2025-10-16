<script setup lang="ts">
import { IconCrown } from '@tabler/icons-vue'
import { nodeItems, type BotNodeCategory, type BotNodeItem } from '~/composables/workflow/useFlowDragAndDrop'

const emit = defineEmits<{
	(e: 'dragStart', { event, nodeItem }: { 
		event: DragEvent, 
		nodeItem: BotNodeItem 
	}): any
}>()

const categories: BotNodeCategory[] = ['send_message', 'question', 'general']
</script>

<template>
	<aside class="max-w-[400px] w-full bg-white p-6 flex flex-col gap-4">
		<div v-for="category in categories" :key="category" class="flex flex-col gap-4">
			<div class="text-lg text-slate-700 uppercase">{{ category }}</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div
					v-for="nodeItem in nodeItems.filter(n => n.category === category)"
					:key="nodeItem.name"
					class="relative flex flex-col gap-2 items-center justify-between border-2 rounded-lg py-4"
					:class="{
						'border-slate-100': !nodeItem.isPremium,
						'border-amber-300': nodeItem.isPremium,
						'cursor-grab': !nodeItem.isPremium,
						'cursor-pointer': nodeItem.isPremium
					}"
					:draggable="!nodeItem.isPremium"
					@dragstart="emit('dragStart', { event: $event, nodeItem })"
				>
					<component class="text-emerald-500" :is="nodeItem.icon" size="32" />
					<IconCrown v-if="nodeItem.isPremium" class="absolute top-0 right-1 text-amber-300" size="18" />
					<div class="text-slate-500">{{ nodeItem.name }}</div>
				</div>
			</div>
		</div>
	</aside>
</template>