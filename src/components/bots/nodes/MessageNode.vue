<script setup lang="ts">
import { IconMessage } from '@tabler/icons-vue'
import { type NodeProps } from '@vue-flow/core'
import { ref, watch } from 'vue'
import { useTextFormatter } from '~/composables/useTextFormatter'
import type { BotNodeDataMap } from '~/types'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'message'
    data: BotNodeDataMap['message']
}>()

defineEmits(['updateNodeInternals'])

const { getPreviewText } = useTextFormatter()

const drawerVisible = ref(false)
const message = ref('')

const onSave = () => {
	props.data.content = message.value
	drawerVisible.value = false
}

watch(drawerVisible, (visible) => {
	if (visible) {
		message.value = props.data.content || ''
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconMessage"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@click="drawerVisible = true"
	>
		<span
			v-if="data.content"
			:id="id"
			class="bg-white p-6 text-gray-500"
			v-html="getPreviewText(data.content)"
		>
		</span>
		<span 
			v-else 
			class="bg-white p-6 text-gray-400"
		>
			{{ $t('bot_workflow.message_placeholder') }}
		</span>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconMessage"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		@onSave="onSave"
	>
		<div class="p-6">
			<TextAreaEditor
				v-model="message"
				:title="$t('bot_workflow.message_label')"
				:placeholder="$t('bot_workflow.message_placeholder')"
				:minHeightClass="'min-h-[12rem]'"
			/>
		</div>
	</BaseNodeDrawer>
</template>