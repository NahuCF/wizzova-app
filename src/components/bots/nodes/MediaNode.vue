<script setup lang="ts">
import { IconFile, IconFileText, IconPhoto, IconVideo, IconVolume } from '@tabler/icons-vue'
import type { NodeProps } from '@vue-flow/core'
import { computed, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { API } from '~/services'
import type { BotNodeDataMap, MediaNodeType } from '~/types'
import { defaultMBLimit, defaultSupportedFormats } from '~/composables/workflow/useFlowDragAndDrop'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'image' | 'video' | 'audio' | 'document'
    data: BotNodeDataMap['image'] | BotNodeDataMap['video'] | BotNodeDataMap['audio'] | BotNodeDataMap['document']
}>()

defineEmits(['updateNodeInternals'])

const route = useRoute()

const drawerVisible = ref(false)
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

const onSave = async () => {
	if(!botId.value) return

	if(newFile.value?.data) {
		loading.value = true
		try {
			const { data: response } = await API.botVersion.uploadMedia(botId.value, newFile.value.data, newData.value.mediaType, props.id)
			newData.value.mediaUrl = response.url
		} catch(error) {
			console.log(error)
		} finally {
			loading.value = false
		}

		props.data.media_type = newData.value.mediaType
		props.data.media_url = newData.value.mediaUrl
		props.data.content = newData.value.content
	}
	else if(newData.value.mediaUrl) {
		props.data.media_type = newData.value.mediaType
		props.data.media_url = newData.value.mediaUrl
		props.data.content = newData.value.content
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
		@click="drawerVisible = true"
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
					<div v-for="type in ['image', 'video', 'audio', 'document']" class="flex items-center gap-2">
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
				<label class="text-lg flex items-center gap-1" for="phone">
					<span class="text-neutral-800">{{ $t(`bot_workflow.send_media.caption`) }}</span>
					<span>({{ $t('optional') }})</span>
				</label>

				<div class="relative">
					<Textarea 
						v-model="newData.content" 
						rows="4" 
						cols="30" 
						fluid 
						class="text-lg! min-h-[6rem]"
						:maxlength="1024"
						:placeholder="$t(`bot_workflow.send_media.caption_placeholder`)"
					/>
					<div class="absolute right-3 bottom-2 text-slate-400">
						{{ newData.content?.length || 0 }} / 4096
					</div>
				</div>
			</div>
		</div>
	</BaseNodeDrawer>
</template>