<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Editor, EditorContent, VueRenderer } from '@tiptap/vue-3'
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder'
import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { IconMoodSmile, IconLoader2 } from '@tabler/icons-vue'
import type { MentionItem, MessageItem, UserItem } from '~/types'
import MentionsSelect from './MentionsSelect.vue'

const props = defineProps<{
	users?: UserItem[]
	disable?: boolean,
	disableCustom?: boolean,
	customEvent?: string,
	replyMessage?: {
		name: string,
		message: MessageItem
	},
	loading?: boolean
}>()

const emit = defineEmits<{
	(e: 'send', payload: { 
		message: string,
		type: 'REPLY' | 'NOTES',
		mentions: Record<string, string>[],
		replyId?: string 
	}): void
	(e: 'customEvent'): void,
	(e: 'onClearReply'): void
}>()

const { t } = useI18n()
const isNote = ref(false)
const emojiPopover = ref()

const suggestion = {
	char: '@',
	items: ({ query }: { query: string }) => {
		if (!isNote.value) return []

		return (props.users || [])
			.filter(u => u.name.toLowerCase().startsWith(query.toLowerCase()))
			.slice(0, 5)
			.map(u => ({ id: u.id.toString(), label: u.name, profile_img_path: u.profile_img_path }))
	},
	render: () => {
		let component: VueRenderer | null = null

		const handleKeyDown = (props: SuggestionKeyDownProps) => {
			if (!component?.ref?.onKeyDown) return false
			return component.ref.onKeyDown(props)
		}

		return {
			onStart: (props: SuggestionProps<MentionItem>) => {
				component = new VueRenderer(MentionsSelect, { props, editor: props.editor })

				if (!component || !props.clientRect) return

				const rect = props.clientRect()
				const el = component.element
				if (!(el instanceof HTMLElement)) return
				if (!rect) return
				
				el.style.position = 'absolute'
				el.style.left = `${rect.left}px`
				el.style.top = `${rect.bottom}px`
				el.style.zIndex = '50'
				document.body.appendChild(el)
			},
			onUpdate: (props: SuggestionProps<MentionItem>) => {
				if (!component || !component.element || !props.clientRect) return
				
				component.updateProps(props)
				const rect = props.clientRect()
				const el = component.element
				if (!(el instanceof HTMLElement)) return
				if (!rect) return

				el.style.left = `${rect.left}px`
				el.style.top = `${rect.bottom}px`
			},
			onKeyDown: handleKeyDown,
			onExit: () => {
				if (!component || !component.element) return
				component.element.remove()
				component.destroy()
				component = null
			}

		}
	},
}

const editor = new Editor({
	extensions: [
		StarterKit,
		Placeholder.configure({
			placeholder: () => isNote.value ? t('conversations.add_private_notes') : t('conversations.write_your_message'),
			showOnlyWhenEditable: false,
		}),
		Mention.configure({ HTMLAttributes: { class: 'text-sky-600 font-semibold' }, suggestion }),
	],
	content: '',
})

const sendDisabled = computed(() => {
	if(!props.customEvent) {
		return editor.getText().trim().length === 0 || props.disable || props.loading
	}
	else {
		return props.disableCustom || props.loading
	}
})

const onSelectEmoji = (emoji: EmojiExt) => {
	editor.commands.insertContent(emoji.i)
	emojiPopover.value?.hide()
}

const getMentions = () => {
  const mentions: Record<string, string>[] = []

	editor.state.doc.descendants((node) => {
		if (node.type.name === 'mention') {
			mentions.push({ [node.attrs.label]: node.attrs.id })
		}
	})

  return mentions
}

const sendMessage = () => {
	const text = editor.getText()
	const mentions = getMentions()

	emit('send', { 
		message: text,
		type: isNote.value ? 'NOTES' : 'REPLY',
		mentions,
		replyId: props.replyMessage?.message.id
	})

	editor.commands.clearContent()
	isNote.value = false
	emit('onClearReply')
}

watch(
	() => props.disable,
	(shouldDisable) => {
		editor.setEditable(!shouldDisable)
		editor.commands.clearContent()
		isNote.value = false
	},
	{ immediate: true }
)

watch(isNote, () => {
	const { state, view } = editor
	view.dispatch(state.tr)
})

onBeforeUnmount(() => editor.destroy())
</script>

<template>
	<div
		class="flex flex-col gap-3 p-4 shadow rounded-lg bg-white"
		:class="{
			'bg-white': !isNote,
			'bg-yellow-100': isNote
		}"
	>
		<ReplyPreview 
			v-if="replyMessage && replyMessage.message.content"
			:name="replyMessage.name"
			:body="replyMessage.message.content"
			:closable="true"
			@onClose="emit('onClearReply')"
		/>

		<EditorContent 
			v-if="editor"
			:editor="editor"
			:class="[
				'rounded-lg p-3 h-[80px] overflow-y-auto overflow-x-hidden text-lg break-words whitespace-pre-wrap',
				props.disable || props.loading ? 'bg-slate-100' : ''
			]"
		/>

		<div class="flex justify-between items-center gap-4">
			<Button
				variant="text"
				:disabled="disable"
				@click="emojiPopover?.toggle($event)"
			>
				<IconMoodSmile size="18" />
			</Button>
			<Popover ref="emojiPopover" :dismissable="true" unstyled>
				<EmojiPicker :native="true" @select="onSelectEmoji" />
			</Popover>

			<div class="flex gap-6">
				<div class="flex items-center gap-2">
					<ToggleSwitch v-model="isNote" :disabled="disable" />
					<span class="text-gray-700">{{ $t('conversations.note') }}</span>
				</div>

				<Button 
					:disabled="sendDisabled"
					class="ml-auto"
					@click="() => props.customEvent && !isNote ? emit('customEvent') : sendMessage()"
				>
					<IconLoader2 v-if="props.loading" class="animate-spin w-6 h-6" />
					<span v-else-if="props.customEvent && !isNote">
						{{ props.customEvent }}
					</span>
					<span v-else>
						{{ t('send') }}
					</span>
				</Button>
			</div>
		</div>
	</div>
</template>

<style scoped>
:deep(.ProseMirror) {
	outline: none;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
	content: attr(data-placeholder);
	float: left;
	color: #9ca3af;
	pointer-events: none;
	height: 0;
}
</style>
