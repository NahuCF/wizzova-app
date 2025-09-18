<script setup lang="ts">
import { defineProps, computed, type Component, ref } from 'vue'
import { IconExternalLink, IconPhone, IconArrowBackUp, IconList, IconCheck, IconClock, IconChecks, IconX, IconTrash, IconChevronDown } from '@tabler/icons-vue'
import type { MessageStatus, TemplateBtn, TemplateBtnType, TemplateCallBtn, TemplateUrlBtn } from '~/types'

const bubbleColors = {
	white: { bg: 'bg-white', border: 'border-t-white' },
	green: { bg: 'bg-green-100', border: 'border-t-green-100' },
	sky: { bg: 'bg-sky-200', border: 'border-t-sky-200' },
	yellow: { bg: 'bg-yellow-100', border: 'border-t-yellow-100' },
	pink: { bg: 'bg-pink-100', border: 'border-t-pink-100' },
	violet: { bg: 'bg-violet-100', border: 'border-t-violet-100' },
	slate: { bg: 'bg-slate-100', border: 'border-t-slate-100' }
}
type BubbleColor = keyof typeof bubbleColors
const statusIcons: Record<MessageStatus, { icon: Component, color: string }> = {
	pending: {
		icon: IconClock,
		color: 'text-slate-400'
	},
	sent: {
		icon: IconCheck,
		color: 'text-slate-400'
	},
	delivered: {
		icon: IconChecks,
		color: 'text-slate-400'
	},
	read: {
		icon: IconChecks,
		color: 'text-sky-500'
	},
	failed: {
		icon: IconX,
		color: 'text-slate-400'
	},
	deleted: {
		icon: IconTrash,
		color: 'text-slate-400'
	}
}

const props = withDefaults(
	defineProps<{
		header?: string,
		body: string,
		footer?: string,
		buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn)[],
		date?: string,
		minWidth?: string,
		maxWidth?: string,
		side?: 'left' | 'right',
		bubbleColor?: BubbleColor,
		showTail?: boolean,
		showOptions?: boolean,
		status?: MessageStatus,
		reply?: { name: string, header?: string; body: string; footer?: string },
		mentions?: Record<string, string>[]
	}>(),
	{
		footer: '',
		side: 'left',
		bubbleColor: 'white',
		showTail: true,
		mentions: () => []
	}
)

const emit = defineEmits<{
	(e: 'onMentionClick', value: { id: string, name: string }): void,
	(e: 'onReply'): void
}>()

const bubbleMenu = ref()
const bubbleMenuOptions = ref([
	{ label: 'Reply', action: () => emit('onReply') },
])
const isHovered = ref(false)

const selectedColor = computed(() => {
	return bubbleColors[props.bubbleColor || 'white']
})

const isVisible = computed(() => {
	return props.body.length ||
		(props.body.length > 0 && props.footer.length) ||
		(props.header && props.header.length && props.header.length > 0)
})

const formattedBodyText = computed(() => {
	if (!props.body) {
		return ''
	}

	let formatedText = props.body
		// variables
		.replace(/{{\s*(\w+)\s*}}/g, (_m, v) =>
			`<mark class='px-1 bg-slate-100 text-green-700 font-semibold'>${v}</mark>`
		)
		// bold/italic/strike/new line
		.replace(/\*(.*?)\*/g, (_m, v) => `<b>${v}</b>`)
		.replace(/_(.*?)_/g, (_m, v) => `<em>${v}</em>`)
		.replace(/~(.*?)~/g, (_m, v) => `<s>${v}</s>`)
		.replace(/\n/g, '<br>')

	if (props.mentions?.length) {
		props.mentions.forEach(m => {
			const [username, id] = Object.entries(m)[0]
			const safe = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const regex = new RegExp(`@${safe}\\b`, 'g')
			formatedText = formatedText.replace(
				regex,
				`<a href="#" class="text-sky-600 font-semibold" data-user-id="${id}" data-username="${username}">@${username}</a>`
			)
		})
	}

	return formatedText
})

const filteredButtons = computed(() => {
	const buttons = props.buttons.filter(b => b.text)

	if (buttons.length <= 3) {
		return buttons
	}

	const firstTwo = buttons.slice(0, 2)
	const showMoreButton: TemplateBtn = {
		type: 'EXPLORE_MORE',
		category: 'explore_more',
		text: 'Explore more'
	}

	return [...firstTwo, showMoreButton]
})

const toggleBubbleMenu = (event: Event) => {
  	bubbleMenu.value?.toggle(event)
}

const onMentionClick = (e: MouseEvent) => {
	const link = (e.target as HTMLElement).closest('a[data-user-id]') as HTMLElement | null
	if (!link) return

	e.preventDefault()

	const id = link.dataset.userId!
	const name = link.dataset.username!
	emit('onMentionClick', { id, name })
}

const iconComponents: Record<TemplateBtnType, Component> = {
	STATIC_URL: IconExternalLink,
	DYNAMIC_URL: IconExternalLink,
	PHONE_NUMBER: IconPhone,
	QUICK_REPLY: IconArrowBackUp,
	EXPLORE_MORE: IconList
}
</script>

<template>
	<div v-if="isVisible" class="inline-block">
		<div class="relative inline-block overflow-visible">

			<div v-if="showTail" :class="['triangle-shadow', side]"></div>
			<div v-if="showTail" :class="[
				'triangle',
				'border-t-[14px]',
				side,
				selectedColor.border
			]">
			</div>

			<div
				class="flex flex-col gap-1 px-3 pt-2 pb-1 message rounded-lg self-start break-all shadow"
				:class="[
					minWidth ?? 'min-w-[18rem]',
					maxWidth ?? 'max-w-[100%]',
					selectedColor.bg
				]"
				@mouseenter="isHovered = true"
  				@mouseleave="isHovered = false"
			>

				<div v-if="reply" class="mb-1">
					<ReplyPreview
						:name="reply.name"
						:header="reply.header"
						:body="reply.body"
						:footer="reply.footer"
					/>
				</div>

				<div class="relative flex flex-col gap-2.5">
					<div v-if="showOptions && isHovered" class="absolute top-0 right-0">
						<Button
							class="p-1! rounded"
							severity="secondary"
							variant="text"
							@click="toggleBubbleMenu"
						>
							<IconChevronDown class="text-gray-500" size="14"/>
						</Button>
					</div>

					<Menu ref="bubbleMenu" :model="bubbleMenuOptions" :popup="true">
						<template #item="{ item, props }">
							<div v-ripple v-bind="props.action" @click="item.action">
								<span>{{ item.label }}</span>
							</div>
						</template>
					</Menu>

					<div v-if="header && header.length > 0" class="font-semibold text-lg">{{ header }}</div>

					<span
						v-if="body.length > 0"
						class="font-regular text-lg"
						v-html="formattedBodyText"
						@click="onMentionClick"
					>
					</span>

					<div class="text-slate-400 italic" v-if="body.length > 0 && footer.length > 0">
						{{ footer }}
					</div>

					<div class="flex flex-col items-center">
						<button v-for="(button, index) in filteredButtons" :key="button.type + index"
							class="w-full flex justify-center items-center gap-2 pt-3 pb-2 text-sm font-light text-sky-600 border-t-1 border-slate-100">
							<component :is="iconComponents[button.type]" class="w-[13px] h-[13px]" />
							{{ button.text }}
						</button>
					</div>
				</div>


				<div v-if="date" class="flex justify-end gap-2">
					<span class="text-sm text-slate-400">
						{{ date }}
					</span>
					<component
						v-if="status"
						:is="statusIcons[status].icon"
						size="14"
						:class="[statusIcons[status].color]"
					/>
					<slot name="status"></slot>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.message {
	position: relative;
	z-index: 10;
	overflow: visible;
}

.triangle {
	position: absolute;
	z-index: 20;
	top: 0;
	width: 0;
	height: 0;
	border-left: 14px solid transparent;
	border-right: 14px solid transparent;
}

.triangle-shadow {
	position: absolute;
	z-index: 5;
	top: 0;
	width: 0;
	height: 0;
	border-top: 14px solid rgba(0, 0, 0, 0.08);
	filter: blur(1.5px);
	pointer-events: none;
	border-left: 14px solid transparent;
	border-right: 14px solid transparent;
}

.triangle.left {
	left: -14px;
}

.triangle.right {
	right: -14px;
}

.triangle-shadow.left {
	left: -14px;
}

.triangle-shadow.right {
	right: -14px;
}
</style>
