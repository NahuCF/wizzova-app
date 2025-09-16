<script setup lang="ts">
import { defineProps, computed, type Component } from 'vue'
import { IconExternalLink, IconPhone, IconArrowBackUp, IconList, IconCheck, IconClock, IconChecks, IconX, IconTrash } from '@tabler/icons-vue'
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
		status?: MessageStatus
	}>(),
	{
		footer: '',
		side: 'left',
		bubbleColor: 'white',
		showTail: true
	}
)

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

	// Hightlight variables
	let formatedText = props.body.replace(/{{\s*(\w+)\s*}}/g, (_match, variableName) => {
		return `<mark class='px-1 bg-slate-100 text-green-700 font-semibold'>${variableName}</mark>`
	})

	formatedText = formatedText.replace(/\*(.*?)\*/g, (_match, value) => {
		return `<b>${value}</b>`
	})

	formatedText = formatedText.replace(/_(.*?)_/g, (_match, value) => {
		return `<em>${value}</em>`
	})

	formatedText = formatedText.replace(/\~(.*?)\~/g, (_match, value) => {
		return `<s>${value}</s>`
	})

	// Add html tags for new line characters
	formatedText = formatedText.replace(/\n/g, '<br>')

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

			<div class="flex flex-col gap-1 px-3 pt-2 pb-1 message rounded-lg self-start break-all shadow"
				:class="[minWidth ?? 'min-w-[18rem]', maxWidth ?? 'max-w-[100%]', selectedColor.bg]">
				<div class="flex flex-col gap-2.5">
					<div v-if="header && header.length > 0" class="font-semibold text-lg">
						{{ header }}
					</div>

					<span class="font-regular text-lg" v-if="body.length > 0" v-html="formattedBodyText"></span>

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
