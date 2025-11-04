<script setup lang="ts">
import { IconQuestionMark, IconAsterisk, IconTrash, IconPlus, IconFileText } from '@tabler/icons-vue'
import { type NodeProps, Position, Handle } from '@vue-flow/core'
import { computed, onMounted, ref, watch } from 'vue'
import { useBotStore } from '~/stores'
import type { BotNodeDataMap, BotNodeHeaderType } from '~/types'
import { API } from '~/services'
import { useRoute } from 'vue-router'
import { useTextFormatter } from '~/composables/useTextFormatter'

const props = defineProps<NodeProps & {
    position: {
        x: number
        y: number
    }
    type: 'ask_question'
    data: BotNodeDataMap['question_button']
}>()

defineEmits(['updateNodeInternals'])

const route = useRoute()
const botStore = useBotStore()
const { getPreviewText } = useTextFormatter()

const drawerVisible = ref(false)

onMounted(() => {
	if (props.data.__isNew) {
		drawerVisible.value = true
	}
})
const newData = ref<{
	headerText?: string,
	headerType: BotNodeHeaderType | 'none',
	headerMediaUrl?: string,
	content: string,
	footerText: string,
	options: {
		id: string,
		title: string
	}[]
}>({
	headerType: 'none',
	content: '',
	footerText: '',
	options: []
})
const newFile = ref<{
	data: File,
	url: string
} | null>(null)
const variablesPopover = ref()
const showVariableDialog = ref(false)
const selectOptionIndex = ref<number | null>(null)
const loading = ref(false)

const botId = computed(() => {
	if(typeof route.params.id === 'string') {
		return route.params.id
	}

	return null
})

const disableSave = computed(() => {
	const isMedia = isMediaType(newData.value.headerType)
	const validMedia = !!(newFile.value || newData.value.headerMediaUrl)
	const validText = !!newData.value.headerText
	const optionExists = !!newData.value.options.find(option => option.title)

	if(isMedia) {
		return !optionExists || !validMedia
	}
	
	if(newData.value.headerType === 'text') {
		return !optionExists || !validText
	}

	return !optionExists
})

const isMediaType = (type: BotNodeHeaderType | 'none'): type is 'image' | 'video' | 'document' => {
  return type === 'image' || type === 'video' || type === 'document'
}

const onSave = async () => {
	if(!botId.value) return

	if(newFile.value?.data && isMediaType(newData.value.headerType)) {
		loading.value = true
		try {
			const { data: response } = await API.botVersion.uploadMedia(botId.value, newFile.value.data, newData.value.headerType, props.id)
			newData.value.headerMediaUrl = response.url
		} catch(error) {
			console.log(error)
		} finally {
			loading.value = false
		}
	}

	props.data.header_type = newData.value.headerType === 'none' ? undefined : newData.value.headerType
	props.data.header_media_url = newData.value.headerMediaUrl
	props.data.header_text = newData.value.headerText
	props.data.content = newData.value.content
	props.data.footer_text = newData.value.footerText
	props.data.options = newData.value.options

	drawerVisible.value = false
}

const openVariablesPopover = (event: MouseEvent, optionIndex: number) => {
	selectOptionIndex.value = optionIndex
	variablesPopover.value.toggle(event)
}

const addVariable = (variableName: string) => {
	if (selectOptionIndex.value !== null) {
		newData.value.options[selectOptionIndex.value].title += `{{${variableName}}}`
	}
}

const addOption = () => {
	newData.value.options.push({
		id: crypto.randomUUID(),
		title: ''
	})
}

const removeOption = (index: number) => {
	newData.value.options = newData.value.options.filter((_, i) => i !== index)
}

watch(drawerVisible, (visible) => {
	if (visible) {
		newData.value.headerType = props.data.header_type || 'none'
		newData.value.headerMediaUrl = props.data.header_media_url
		newData.value.headerText = props.data.header_text
		newData.value.content = props.data.content || ''
		newData.value.options = props.data.options || [{
			id: crypto.randomUUID(),
			title: ''
		}]
		newData.value.footerText = props.data.footer_text || ''
	}
})
</script>

<template>
	<BaseNode
		:id="id"
		:icon="IconQuestionMark"
		:title="$t(`bot_workflow.nodes.${type}`)"
		@onEdit="drawerVisible = true"
		@onDelete="API.botVersion.deleteMedia(botId || '', props.data.media_url)"
	>
		<div class="bg-white p-6 flex flex-col gap-2">
			<div>
				<img v-if="props.data.header_type === 'image'" :src="props.data.header_media_url" />
				<div v-else-if="props.data.header_media_url" class="flex items-center gap-3">
					<div>
						<IconFileText class="text-emerald-500" size="32" />
					</div>
					<div class="text-lg truncate">{{ data.header_media_url }}</div>
				</div>
				<div v-else-if="props.data.header_type === 'text'">
					<div class="text-lg">{{ data.header_text }}</div>
				</div>
			</div>

			<span
				v-if="data.content"
				:id="id"
				class="bg-white py-1 text-gray-500"
				v-html="getPreviewText(data.content)"
			>
			</span>

			<div
				v-for="option in data.options || []"
				:key="option.id"
				class="relative flex justify-center items-center gap-2 p-4 bg-slate-100 rounded-md"
			>
				<div class="font-bold text-emerald-700">
					{{ option.title }}
				</div>
				<Handle
					:id="option.id"
					type="source"
					class="bg-emerald-500! w-3! h-3!"
					:position="Position.Right"
					:connectable="true"
				/>
			</div>

			<div v-if="data.footer_text" class="pt-1">{{ data.footer_text }}</div>
		</div>
		
		<template #handles>
			<Handle id="target" type="target" :position="Position.Left" :connectable="true" />
		</template>
	</BaseNode>

	<BaseNodeDrawer
		:icon="IconQuestionMark"
		:title="$t(`bot_workflow.nodes.${type}`)"
		v-model:visible="drawerVisible"
		:disableSave="disableSave"
		:loading="loading"
		@onSave="onSave"
	>
		<div class="bg-white p-6 flex flex-col gap-8 overflow-y-auto overflow-x-hidden">
			<div class="flex flex-col gap-4">
				<div>
					<div class="flex gap-1 mb-2">
						<h2 class="font-medium text-lg">{{ $t('bot_workflow.question_button.header_type')  }}</h2>
						<IconAsterisk color="red" size="8" />
					</div>

					<div class="flex gap-2 w-full">
						<div v-for="type in ['none', 'text', 'image', 'video', 'document']" class="flex items-center gap-2">
							<RadioButton
								v-model="newData.headerType"
								:inputId="type"
								:value="type"
							/>
							<label :for="type" class="text-lg font-normal cursor-pointer">
								{{ $t(`bot_workflow.question_button.${type}`) }}
							</label>
						</div>
					</div>
				</div>

				<NodeFileUpload
					v-if="newData.headerType === 'image' || newData.headerType === 'video' || newData.headerType === 'document'"
					v-model:modelValue="newFile"
					v-model:mediaUrl="newData.headerMediaUrl"
					:mediaType="newData.headerType"
				/>

				<div v-if="newData.headerType === 'text'">
					<div class="relative">
						<InputText 
							v-model="newData.headerText"
							class="!pr-[5.5rem]" 
							name="name"
							id="name" 
							fluid 
							:maxlength="60" 
							:placeholder="$t('bot_workflow.question_button.text_placeholder')"
						/>
						<div class="absolute right-3 top-2 text-slate-400">
							{{ newData.headerText?.length || 0 }} / 60
						</div>
					</div>
				</div>
			</div>

			<TextAreaEditor
				v-model="newData.content"
				:title="$t('bot_workflow.question_button.question_text')"
				:placeholder="$t('bot_workflow.question_button.question_text_placeholder')"
				:maxLength="1024"
				:minHeightClass="'min-h-[8rem]'"
				optional
			/>

			<div class="flex flex-col gap-2">
				<div class="flex gap-1">
					<h2 class="font-medium text-lg">
						{{ $t('bot_workflow.question_button.options') }}
					</h2>
					<IconAsterisk color="red" size="8" />
				</div>

				<div
					v-for="(option, index) in newData.options"
					:key="index"
					class="relative flex flex-col gap-4 p-4 bg-slate-100 rounded-md"
				>
					<div class="flex flex-col gap-2">
						<label class="font-medium">
							{{ $t('bot_workflow.question_button.button_title') }}
						</label>
						
						<div class="relative">
							<InputText 
								v-model="option.title" 
								:placeholder="$t('bot_workflow.question_button.button_title_placeholder')" 
								fluid
								:id="`option${index}`"
								:name="`option${index}`"
								:maxlength="20"
							/>
							<div class="absolute right-3 top-2 text-slate-400">
								{{ option.title?.length || 0 }} / 20
							</div>
						</div>

						<Button
							severity="info"
							variant="outlined"
							class="self-start !border !border-slate-300 font-bold text-base!"
							size="small"
							@click="openVariablesPopover($event, index)"
						>
							{{ $t('new_template.body.add_variable') }}
						</Button>
					</div>

					<IconTrash
						v-if="newData.options.length > 1"
						class="absolute top-3 right-3 cursor-pointer"
						size="16"
						@click="removeOption(index)"
					/>
				</div>

				<div v-if="newData.options.length < 3">
					<Button text @click="addOption">
						<IconPlus size="16" class="inline mr-1" />
						{{ $t('bot_workflow.question_button.add_option') }}
					</Button>
				</div>
			</div>

			<div>
				<div class="flex gap-1 mb-2">
					<h2 class="font-medium text-lg">{{ $t('bot_workflow.question_button.footer')  }}</h2>
					<span class="text-lg">({{ $t('optional') }})</span>
				</div>

				<div class="relative">
					<InputText
						v-model="newData.footerText" 
						class="!pr-[5.5rem]" 
						name="name"
						id="name" 
						fluid 
						:maxlength="60" 
						:placeholder="$t('bot_workflow.question_button.footer_placeholder')"
					/>
					<div class="absolute right-3 top-2 text-slate-400">
						{{ newData.footerText?.length || 0 }} / 60
					</div>
				</div>
			</div>
		</div>

		<BotVariableSelect
			ref="variablesPopover"
			@onCreate="showVariableDialog = true"
			@onSelect="addVariable"
		/>

		<BotVariableDialog 
			v-model:visible="showVariableDialog" 
			@onCreated="botStore.variables.push($event)"
		/>
	</BaseNodeDrawer>
</template>