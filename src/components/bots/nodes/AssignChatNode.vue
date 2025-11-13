<script setup lang="ts">
import { IconUser } from '@tabler/icons-vue'
import { type NodeProps, useVueFlow } from '@vue-flow/core'
import { computed, onMounted, ref, watch } from 'vue'
import { useBotStore, useUserStore } from '~/stores';
import type { BotNodeDataMap } from '~/types'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'assign_chat'
    data: BotNodeDataMap['assign_chat']
}>()

defineEmits(['updateNodeInternals'])

const { updateNodeData } = useVueFlow()

const userStore = useUserStore()
const botStore = useBotStore()

const drawerVisible = ref(false)

onMounted(() => {
	if (props.data.__isNew) {
		drawerVisible.value = true
	}
})
const assignType = ref('user')
const assigneeId = ref<string>()

const assignee = computed(() => {
	if (props.data.assign_type === 'user') {
		return userStore.users.find(u => u.id === props.data.assign_to_user_id) || null
	} else if (props.data.assign_type === 'bot') {
		return botStore.bots.find(b => b.id === props.data.assign_to_bot_id) || null
	} else {
		return null
	}
})

const onSave = () => {
	if(assignType.value === 'user') {
		updateNodeData(props.id, { 
			...props.data, 
			assign_type: 'user', 
			assign_to_user_id: assigneeId.value, 
			assign_to_bot_id: undefined 
		})
	} else if(assignType.value === 'bot') {
		updateNodeData(props.id, { 
			...props.data, 
			assign_type: 'bot', 
			assign_to_bot_id: assigneeId.value, 
			assign_to_user_id: undefined 
		})
	}
	drawerVisible.value = false
}

watch(drawerVisible, (visible) => {
	if (visible) {
		assignType.value = props.data.assign_type || 'user'
		assigneeId.value = props.data.assign_type === 'user' ? props.data.assign_to_user_id : props.data.assign_to_bot_id
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconUser"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
	>
		<div class="bg-white p-6 text-gray-500">
			{{ 
				assignee
					? $t('bot_workflow.assign_chat.assigned_to', { name: assignee.name }) 
					: $t('bot_workflow.assign_chat.unassigned')
			}}
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconUser"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		@onSave="onSave"
	>
		<div class="p-6 flex flex-col gap-6">
			<div>
				<div class="flex gap-1 mb-2">
					<h2 class="font-medium text-lg">{{ $t('bot_workflow.assign_chat.type') }}</h2>
				</div>

				<div class="flex gap-2 w-full">
					<div class="flex items-center gap-2">
						<RadioButton
							v-model="assignType"
							inputId="user"
							value="user"
						/>
						<label for="user" class="text-lg font-normal cursor-pointer">
							{{ $t('bot_workflow.assign_chat.user') }}
						</label>
					</div>
					<div class="flex items-center gap-2">
						<RadioButton
							v-model="assignType"
							inputId="bot"
							value="bot"
						/>
						<label for="bot" class="text-lg font-normal cursor-pointer">
							{{ $t('bot_workflow.assign_chat.bot') }}
						</label>
					</div>
				</div>
			</div>

			<div>
				<div class="flex gap-1 mb-2">
					<h2 class="font-medium text-lg">
						{{ 
							assignType === 'user'
								? $t('bot_details.select_user')
								: $t('bot_details.select_bot')
						}}
					</h2>
				</div>

				<Select
					v-if="assignType === 'user'"
					:modelValue="assigneeId"
					@change="assigneeId = $event.value"
					:options="userStore.users"
					optionValue="id" optionLabel="name"
					:loading="userStore.loading"
					:placeholder="$t('bot_details.select_user')"
				/>

				<Select
					v-else
					:modelValue="assigneeId"
					@change="assigneeId = $event.value"
					:options="botStore.bots"
					optionValue="id"
					optionLabel="name"
					:loading="botStore.loading"
					:placeholder="$t('bot_details.select_bot')"
				/>
			</div>
		</div>
	</BaseNodeDrawer>
</template>