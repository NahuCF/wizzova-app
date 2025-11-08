<script setup lang="ts">
import { IconFile, IconFileText, IconPhoto, IconVideo, IconVolume } from '@tabler/icons-vue'
import { type NodeProps, useVueFlow } from '@vue-flow/core'
import { computed, ref, watch, onMounted, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { API } from '~/services'
import type { BotNodeDataMap, MediaNodeType } from '~/types'
import { defaultMBLimit, defaultSupportedFormats } from '~/composables/workflow/useFlowDragAndDrop'
import { useSessionStore } from '~/stores'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'image' | 'video' | 'audio' | 'document'
    data: BotNodeDataMap['image'] | BotNodeDataMap['video'] | BotNodeDataMap['audio'] | BotNodeDataMap['document']
}>()

defineEmits(['updateNodeInternals'])

const { updateNodeData } = useVueFlow()

const route = useRoute()
const sessionStore = useSessionStore()

const drawerVisible = ref(false)

onMounted(() => {
	if (props.data.__isNew) {
		drawerVisible.value = true
	}
})

const newData = ref<{
	mediaType: MediaNodeType,
	mediaUrl: string,
	content?: string
}>({
	mediaType: 'image',
	mediaUrl: ''
})
const newFile = ref<{
	data: File,
	url: string
} | null>(null)
const loading = ref(false)

const icons: Record<MediaNodeType, Component> = {
	image: IconPhoto,
	video: IconVideo,
	audio: IconVolume,
	document: IconFile
}

const nodeIcon = computed(() => icons[props.type])
const drawerIcon = computed(() => icons[newData.value.mediaType])
const botId = computed(() => {
	if(typeof route.params.id === 'string') {
		return route.params.id
	}

	return null
})
const allowedTypes = computed<MediaNodeType[]>(() => {
	const types: MediaNodeType[] = sessionStore.hasPremiumAccess 
		? ['image', 'video', 'audio', 'document'] 
		: ['image', 'document']

	return types
})

const onSave = async () => {
	if(!botId.value) return

	let finalMediaUrl = newData.value.mediaUrl

	if(newFile.value?.data) {
		loading.value = true
		try {
			const { data: response } = await API.botVersion.uploadMedia(botId.value, newFile.value.data, newData.value.mediaType, props.id)
			finalMediaUrl = response.url
		} catch(error) {
			console.log(error)
			return
		} finally {
			loading.value = false
		}
	}

	if(finalMediaUrl || newData.value.content) {
		updateNodeData(props.id, {
			...props.data,
			media_type: newData.value.mediaType,
			media_url: finalMediaUrl,
			content: newData.value.content
		})
	}

	drawerVisible.value = false
}

watch(drawerVisible, (visible) => {
	if (visible) {
		newData.value.mediaType = props.type
		newData.value.mediaUrl = props.data.media_url
		newData.value.content = props.data.content
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="nodeIcon"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@onDelete="API.botVersion.deleteMedia(botId || '', props.data.media_url)"
	>
		<div class="bg-white p-6 flex flex-col gap-2">
			<img v-if="props.data.media_type === 'image'" :src="props.data.media_url" />
			<div v-else-if="props.data.media_url" class="flex items-center gap-3">
				<div>
					<IconFileText class="text-emerald-500" size="32" />
				</div>
				<div class="text-lg truncate">{{ data.media_url }}</div>
			</div>
		</div>
	</BaseNode>

	<BaseNodeDrawer
		:icon="drawerIcon"
		:title="$t(`bot_workflow.nodes.${type}`)"
		:loading="loading"
		v-model:visible="drawerVisible"
		:disableSave="!newFile && !newData.mediaUrl"
		@onSave="onSave"
	>
		<div class="bg-white p-6 flex flex-col gap-8 overflow-y-auto overflow-x-hidden">
			<div>
				<div class="flex gap-1 mb-2">
					<h2 class="font-medium text-lg">{{ $t('bot_workflow.send_media.media_type') + ` (${$t('bot_workflow.send_media.max_file_size', defaultMBLimit[newData.mediaType])})`  }}</h2>
				</div>

				<div class="flex gap-2 w-full">
					<div v-for="type in allowedTypes" class="flex items-center gap-2">
						<RadioButton
							v-model="newData.mediaType"
							:inputId="type"
							:value="type"
						/>
						<label :for="type" class="text-lg font-normal cursor-pointer">
							{{ $t(`bot_workflow.send_media.${type}`) }}
						</label>
					</div>
				</div>
			</div>

			<div v-if="newData.mediaType !== 'document'">
				<div class="flex items-baseline gap-1 mb-2 text-gray-500">
					<h2 class="text-lg">{{ $t('bot_workflow.send_media.allowed_media_type')  }}: {{ defaultSupportedFormats[newData.mediaType].join(', ') }}</h2>
				</div>
			</div>

			<NodeFileUpload
				v-model:modelValue="newFile"
				v-model:mediaUrl="newData.mediaUrl"
				:mediaType="newData.mediaType"
			/>

			<div class="flex flex-col gap-1 mt-4">
				<div class="flex items-center justify-between">
					<label class="text-lg flex items-center gap-1" for="phone">
						<span class="text-neutral-800">{{ $t(`bot_workflow.send_media.caption`) }}</span>
						<span>({{ $t('optional') }})</span>
					</label>
					<span class="text-sm text-slate-400">
						{{ newData.content?.length || 0 }} / 1024
					</span>
				</div>

				<Textarea 
					v-model="newData.content" 
					rows="4" 
					cols="30" 
					fluid 
					class="text-lg! min-h-[6rem]"
					:maxlength="1024"
					:placeholder="$t(`bot_workflow.send_media.caption_placeholder`)"
				/>
			</div>
		</div>
	</BaseNodeDrawer>
</template>