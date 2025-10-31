<script setup lang="ts">
import { IconClock, IconInfoCircle } from '@tabler/icons-vue'
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { BotNodeDataMap } from '~/types'

defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'working_hours'
    data: BotNodeDataMap['working_hours']
}>()

defineEmits(['updateNodeInternals'])

const router = useRouter()

const drawerVisible = ref(false)
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconClock"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@click="drawerVisible = true"
	>
		<div class="flex-basis bg-white p-6 flex flex-col gap-2">
			<div class="relative flex justify-center items-center gap-2 p-4 bg-slate-100 rounded-md">
				<div>
					{{ $t('bot_workflow.working_hours.available') }}
				</div>
				<Handle
					id="Available"
					type="source"
					class="bg-green-600! w-3! h-3!"
					:position="Position.Right"
					:connectable="true"
				/>
			</div>

			<div class="relative flex justify-center items-center gap-2 p-4 bg-slate-100 rounded-md">
				<div>
					{{ $t('bot_workflow.working_hours.unavailable') }}
				</div>
				<Handle
					id="Unavailable"
					type="source"
					class="bg-red-600! w-3! h-3!"
					:position="Position.Right"
					:connectable="true"
				/>
			</div>
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconClock"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		@onSave="drawerVisible = false"
	>
		<div class="bg-white p-6 flex flex-col gap-8 overflow-y-auto overflow-x-hidden">
			<div class="text-lg">{{ $t('bot_workflow.working_hours.description') }}</div>

			<Message severity="info">
				<div class="flex items-center gap-2">
					<IconInfoCircle size="16" />
					<div class="text-slate-500">{{ $t('bot_workflow.working_hours.unset_warning') }}</div>
				</div>
			</Message>
			
			<div class="flex mt-8 text-lg gap-2">
				<div>{{ $t('bot_workflow.working_hours.configure_hours') }}</div>
				<div
					class="text-sky-600 cursor-pointer"
					@click="router.push('/settings/company')"
				>
					{{ $t('click_here') }}
				</div>
			</div>
		</div>
	</BaseNodeDrawer>
</template>