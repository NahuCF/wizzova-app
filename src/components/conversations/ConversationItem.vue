<script setup lang="ts">
import moment from 'moment'
import { IconPin, IconPinFilled } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { useContactUtils } from '~/composables/useContactUtils'
import type { ConversationItem } from '~/types'
import { API } from '~/services'

const props = defineProps<{
	conversation: ConversationItem,
	highlight?: boolean
}>()

const emit = defineEmits<{
	(e: 'onClick', value: ConversationItem): void,
	(e: 'onPin', value: { conversation: ConversationItem, pin: boolean}): void
}>()

const { getContactName } = useContactUtils()

const isHovered = ref(false)
const isPinHovered = ref(false)

const progress = computed(() => {
	if(props.conversation.is_solved) return 0

	const start = props.conversation.started_at
	const end = props.conversation.expires_at
	if (!start || !end) return 1

	const startMoment = moment(start)
	const endMoment = moment(end)
	const now = moment()

	if (!startMoment.isValid() || !endMoment.isValid()) return 0

	const total = endMoment.diff(startMoment)
	const remaining = endMoment.diff(now)
	return Math.max(0, remaining / total)
})

const borderStyle = computed(() => {
	if (props.conversation.is_expired) return {}

	const angle = Math.round(progress.value * 360)

	return {
		background: `conic-gradient(var(--p-primary-color) 0deg ${angle}deg, transparent ${angle}deg 360deg)`
	}
})

const pinned = computed(() => props.conversation.is_pinned)
</script>

<template>
	<div 
		class="flex justify-between p-4 border-l-3 hover:bg-emerald-50 cursor-pointer overflow-hidden"
		:class="{
			'bg-emerald-50': highlight,
			'border-emerald-500': highlight,
			'border-transparent': !highlight
		}"
		@mouseenter="isHovered = true"
		@mouseleave="isHovered = false"
		@click.stop="() => emit('onClick', conversation)"
	>
		<div class="flex items-center gap-3 flex-1 overflow-hidden">
			<div
				class="relative rounded-full p-[2px]"
				:style="borderStyle"
			>
				<Avatar
					:label="getContactName(conversation.contact)?.charAt(0).toLocaleUpperCase()"
					size="large"
					shape="circle"
				/>
			</div>
			<div class="flex flex-col justify-between gap-1 min-w-0 flex-1">
				<div>{{ getContactName(conversation.contact) }}</div>
				<div class="text-gray-400 font-light truncate">
					{{ conversation.last_message?.content }}
				</div>
			</div>
		</div>
		<div class="flex flex-col justify-between items-end gap-2">
			<div class="text-sm text-gray-400">
				{{ conversation.last_message_at && moment(conversation.last_message_at).format('h:mm A') }}
			</div>
			
			<div class="flex gap-1">
				<Badge
					v-if="conversation.unread_count > 0"
					rounded
					:value="conversation.unread_count"
					size="small"
				/>
				<div
					v-if="pinned || isHovered"
					@mouseenter="isPinHovered = true"
					@mouseleave="isPinHovered = false"
					@click.stop="emit('onPin', { conversation, pin: !conversation.is_pinned })"
				>
					<IconPinFilled v-if="pinned || isPinHovered" class="text-slate-400" size="16" />
					<IconPin v-else class="text-slate-400" size="16" />
				</div>
			</div>
		</div>
	</div>
</template>