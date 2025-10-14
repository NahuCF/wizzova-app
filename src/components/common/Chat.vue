<script setup lang="ts">
import 'vue3-emoji-picker/css'
import { IconNote, IconLoader2, IconCancel } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConversationActivity, MessageItem, TemplateItem, UserItem } from '~/types'
import { useMessagesStore } from '~/stores/messages'
import { useChatScroll, type ChatEmit } from '~/composables/useChatScroll'

type TimelineItem =
	| ({ kind: 'message' } & MessageItem)
	| ({ kind: 'activity' } & ConversationActivity)

const props = defineProps<{
	conversationId?: string,
	contactName: string,
	messages: MessageItem[],
	activities: ConversationActivity[],
	assignedUser?: UserItem,
	disableReply?: boolean,
	customEvent?: string,
	templates?: Record<string, TemplateItem>
	loadingTop?: boolean,
	loadingBottom?: boolean,
	users?: UserItem[],
	allMessagesLoaded?: boolean,
	initiated: boolean,
	expiresAt?: string
}>()

const emit = defineEmits<ChatEmit>()

const { t } = useI18n()
const messagesStore = useMessagesStore()

const replyMessage = ref<MessageItem>()
const chatScroll = ref<HTMLDivElement>()
const lastConversationId = ref(props.conversationId)
const isJumpingToMessage = ref(false)

const reply = computed(() => {
	if(replyMessage.value) {
		return {
			name: props.contactName,
			message: replyMessage.value
		}
	}

	return undefined
})

const timeline = computed<TimelineItem[]>(() => {
	const messageItems = props.messages.map(m => ({ ...m, kind: 'message' as const }))
	const activityItems = props.activities.map(a => ({ ...a, kind: 'activity' as const }))

	const oldestMessageTime = messageItems.length
		? new Date(messageItems[messageItems.length - 1].created_at).getTime()
		: 0

	const filteredActivities = activityItems.filter(a => {
		const activityTime = new Date(a.event_at).getTime()
		return activityTime >= oldestMessageTime || props.allMessagesLoaded
	})

	return [...filteredActivities, ...messageItems].sort((a, b) => {
		const aTime = a.kind === 'message' ? a.created_at : a.event_at
		const bTime = b.kind === 'message' ? b.created_at : b.event_at
		return new Date(aTime).getTime() - new Date(bTime).getTime()
	})
})

const groupedTimeline = computed(() => {
	const groups: Record<string, TimelineItem[]> = {}
	for (const item of timeline.value) {
		const dateKey = moment(
		item.kind === 'message' ? item.created_at : item.event_at
		).format('YYYY-MM-DD')

		if (!groups[dateKey]) groups[dateKey] = []
		groups[dateKey].push(item)
	}

	return Object.entries(groups)
		.sort(([a], [b]) => (a > b ? 1 : -1))
		.map(([date, items]) => ({ date, items }))
		.reverse()
})

const messagePagination = computed(() => {
	if(props.conversationId) {
		return messagesStore.messagesPaginationByConversation[props.conversationId]
	}

	return null
})

const expires = computed(() => {
	const start = moment.now()
	const end = moment(props.expiresAt)

	const duration = moment.duration(end.diff(start))

	const values = {
		hours: Math.floor(duration.asHours()),
		minutes: duration.minutes()
	}

	if(values.hours > 0 && values.minutes > 0) {
		return t('chat.expires_in', { time: `${values.hours}h ${values.minutes}m`})
	}

	if(values.minutes > 0) {
		return t('chat.expires_in', { time: `${values.minutes}m`})
	}

	return ''
})

const dateLabel = (date: string) => {
    const m = moment(date)
    if (m.isSame(moment(), 'day')) return t('today')
    if (m.isSame(moment().subtract(1, 'day'), 'day')) return t('yesterday')
    if (m.isAfter(moment().subtract(7, 'days'))) return m.format('dddd')
    return m.format('MMM D, YYYY')
}

const shouldShowTail = (item: MessageItem, allItems: TimelineItem[]) => {
	const msgs: MessageItem[] = allItems.filter(i => i.kind === 'message')
	const idx = msgs.indexOf(item)

	return idx === 0 || item.direction !== msgs[idx - 1].direction
}

const getTemplate = (templateId: string) => {
	return props.templates?.[templateId]
}

const templateBody = (templateId: string) => {
	const template = getTemplate(templateId)

	if(template?.components.body) {
		return template?.components.body.content
	}

	return ''
}

const templateHeader = (templateId: string) => {
	const template = getTemplate(templateId)

	if(template?.components.header && !Array.isArray(template?.components.header)) {
		return template?.components.header.text
	}

	return ''
}

const activityMessage = (act: ConversationActivity)  => {
	const time = moment(act.event_at).format('HH:mm')
	switch (act.type) {
		case 'assigned': {
			const { old_user_name, new_user_name } = act.data
			return old_user_name
				? t('chat.assigned_from_user_to_user', { old_user_name, new_user_name, time })
				: t('chat.assigned_to_user', { new_user_name, time })
		}
		case 'unassigned':
			return t('chat.unassigned', { old_user_name: act.data.old_user_name, time })
		case 'resolved':
			return t('chat.resolved', { user_name: act.data.user_name, time })
		case 'reopened':
			return t('chat.reopened', { user_name: act.data.user_name, time })
		case 'conversation_started':
			return t('chat.conversation_started', { user_name: act.data.user_name, time })
		case 'conversation_expired':
			return t('chat.conversation_expired', { time })
	}
}

const getReply = (item: MessageItem) => {
	if(item.reply_to_message) {
		return {
			name: item.direction === 'inbound' ? props.contactName : props.assignedUser?.name || 'Unknown',
			body: item.reply_to_message?.content || ''
		}
	}
	
	return undefined
}

watch(
	() => props.messages,
	async (newMessages, oldMessages) => {
		if (!chatScroll.value) return

		const conversationChanged = props.conversationId !== lastConversationId.value

		const loadingOlderMessages = !!oldMessages.length && newMessages.length > oldMessages.length &&
			newMessages[newMessages.length - 1].id !== oldMessages[oldMessages.length - 1].id

		const newMessageReceived =
			oldMessages.length &&
			newMessages.length &&
			oldMessages[0].id !== newMessages[0].id

		if(newMessageReceived && !conversationChanged) {
			await nextTick()
			scrollToBottom()
		}
		else if (loadingOlderMessages) {
			maintainScrollForTopLoad()
		}

		if(conversationChanged) {
			await nextTick()
			scrollToBottom(false)
			lastConversationId.value = props.conversationId
		}
	},
	{ deep: true }
)

watch(() => messagesStore.lastDeletedMessage, (deleted) => {
	if(deleted?.message_id === replyMessage.value?.id) {
		replyMessage.value = undefined
	}
})

watch(isJumpingToMessage, () => {
	if(!isJumpingToMessage.value) {
		onScroll(emit)
	}
})

const {
	scrollToBottom,
	onScroll,
	placeholderForMissingPage,
	maintainScrollForTopLoad,
	scrollToMessage
} = useChatScroll(chatScroll, props, messagesStore, isJumpingToMessage, messagePagination)

defineExpose({ scrollToMessage })
</script>

<template>
	<div class="flex flex-col flex-1 h-full chat-background overflow-hidden">
		<div
			ref="chatScroll"
			class="flex flex-col-reverse px-4 py-12 gap-8 overflow-y-auto h-full"
			@scroll="onScroll(emit)"
		>
			<div v-if="loadingBottom" class="flex justify-center p-8">
				<IconLoader2 class="animate-spin text-emerald-500" size="36" />
			</div>

			<div
				v-if="messages.length > 0 || allMessagesLoaded"
				v-for="group in groupedTimeline"
				:key="group.date"
				class="flex flex-col gap-3"
			>
				<Divider class="my-20!" align="center" type="solid">
					<span class="bg-gray-200 text-gray-600 text-lg px-8 py-2 rounded-full">
						{{ dateLabel(group.date) }}
					</span>
				</Divider>

				<template v-for="(item) in group.items" :key="item.id">
					<div
						v-if="placeholderForMissingPage(item.id)"
						class="flex justify-center p-8"
						:data-missing-page="placeholderForMissingPage(item.id)"
					>
						<IconLoader2 class="animate-spin text-emerald-500" size="36" />
					</div>

					<div
						v-else-if="item.kind === 'activity'"
						class="text-center my-8"
					>
						<span class="text-lg bg-gray-200 text-gray-700 px-4 py-2 rounded-full">
							{{ activityMessage(item) }}
						</span>
					</div>

					<div
						v-else
						class="flex px-4 z-2"
						:class="item.direction === 'inbound' ? 'justify-start' : 'justify-end'"
						:data-message-id="item.kind === 'message' ? item.id : null"
					>
						<MessagePreview
							v-if="item.type === 'template' && item.template_id"
							:header="templateHeader(item.template_id)" 
							:body="templateBody(item.template_id)"
							:footer="getTemplate(item.template_id)?.components.footer"
							:buttons="getTemplate(item.template_id)?.components.buttons || []"
							:date="moment(item.created_at).format('h:mm A')"
							:status="item.status"
							:side="item.direction === 'inbound' ? 'left' : 'right'"
							:bubbleColor="item.direction === 'inbound' ? 'white' : 'sky'"
							:showTail="shouldShowTail(item, group.items)"
						/>

						<MessagePreview
							v-else-if="item.type === 'text'"
							:visible="item.status === 'deleted'"
							:body="item.content ?? ''"
							:buttons="[]"
							:date="moment(item.created_at).format('h:mm A')"
							:status="item.direction === 'outbound' ? item.status : undefined"
							:side="item.direction === 'inbound' ? 'left' : 'right'"
							:bubbleColor="item.direction === 'inbound' ? 'white' : 'sky'"
							:showTail="shouldShowTail(item, group.items)"
							:showOptions="item.direction === 'inbound' && item.status !== 'deleted'"
							:reply="getReply(item)"
							@onReply="replyMessage = item"
						>
							<template v-if="item.status === 'deleted'" #body>
								<div class="flex items-center gap-1 text-sm text-gray-400 font-light italic">
									<IconCancel size="12" />
									{{ $t('chat.message_deleted') }}
								</div>
							</template>
						</MessagePreview>

						<MessagePreview
							v-else-if="item.type === 'note'"
							:body="item.content ?? ''"
							:buttons="[]"
							:date="moment(item.created_at).format('h:mm A')"
							:side="item.direction === 'inbound' ? 'left' : 'right'"
							bubbleColor="yellow"
							:showTail="shouldShowTail(item, group.items)"
							:mentions="item.mentions"
						>
							<template #status>
								<IconNote class="text-yellow-600" size="16" />
							</template>
						</MessagePreview>
						
						<div 
							v-if="item.direction === 'outbound' && assignedUser" 
							class="pl-4 flex"
						>
							<Avatar
								v-if="shouldShowTail(item, group.items)"
								:label="assignedUser.name.charAt(0).toLocaleUpperCase()"
								shape="circle"
							/>
							<div v-else class="pl-[24px]"></div>
						</div>
					</div>
				</template>
			</div>

			<div v-if="loadingTop" class="flex justify-center p-8">
				<IconLoader2 class="animate-spin text-emerald-500" size="36" />
			</div>
		</div>


		
		<div class="flex flex-col gap-2">
			<div class="text-center font-medium">
				{{ expires }}
			</div>

			<div class="flex flex-col gap-3 mx-6 mb-8 shadow rounded-lg mt-auto">
				<ChatEditor
					:users="users"
					:loading="loadingBottom"
					:disable="disableReply"
					:customEvent="customEvent"
					:replyMessage="reply"
					@send="emit('onSendMessage', $event)"
					@customEvent="emit('onCustomEvent')"
					@onClearReply="replyMessage = undefined"
				/>
			</div>
		</div>
	</div>
</template>

<style lang="css" scoped>
.chat-background {
	background-image: url('/images/pattern.png');
	background-position: center;
}

:deep(.p-divider-content) {
	background-color: transparent;
}

</style>