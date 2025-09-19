<script setup lang="ts">
import 'vue3-emoji-picker/css'
import { IconNote } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ConversationActivity, MessageItem, TemplateItem, UserItem } from '~/types'

type TimelineItem =
	| ({ kind: 'message' } & MessageItem)
	| ({ kind: 'activity' } & ConversationActivity)

const props = defineProps<{
	contactName: string,
	messages: MessageItem[],
	activities: ConversationActivity[],
	assignedUser?: UserItem,
	disableReply?: boolean,
	customEvent?: string,
	templates?: TemplateItem[]
	loading?: boolean,
	users?: UserItem[]
}>()

const emit = defineEmits<{
	(e: 'onSendMessage', { message, type, mentions }: {
		message: string, 
		type: 'REPLY' | 'NOTES',
		mentions: Record<string, string>[],
		replyId?: string
	}): void
	(e: 'onCustomEvent'): void,
	(e: 'scrollTopReached'): void,
	(e: 'scrollBottomReached'): void
}>()

const { t } = useI18n()

const replyMessage = ref<MessageItem>()
const chatScroll = ref<HTMLDivElement>()
const isAtBottom = ref(true)

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

	return [...activityItems, ...messageItems].sort((a, b) => {
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
	return props.templates?.find(templ => templ.id === templateId)
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

// const scrollToBottom = (smooth = false) => {
// 	const el = chatScroll.value
// 	if (!el) return

// 	el.scrollTo({
// 		top: el.scrollHeight,
// 		behavior: smooth ? 'smooth' : 'auto'
// 	})
// }

const onScroll = () => {
	const el = chatScroll.value
	if (!el) return

	const threshold = 10
	isAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
	if (el.scrollTop === 0) {
		emit('scrollTopReached')
	}
	if (el.scrollTop + el.clientHeight >= el.scrollHeight) {
		emit('scrollBottomReached')
	}
}

// watch(
// 	() => [props.messages.length, props.activities.length],
// 	async ([msgLen, actLen], [oldMsgLen, oldActLen]) => {
// 		await nextTick()
// 		if (!chatScroll.value) return

// 		if (oldMsgLen === 0 && msgLen > 0) {
// 			scrollToBottom()
// 			return
// 		}
// 		if (oldActLen === 0 && actLen > 0) {
// 			scrollToBottom()
// 			return
// 		}
// 		if (isAtBottom.value) scrollToBottom(true)
// 	}
// )
</script>

<template>
	<div class="flex flex-col flex-1 h-full chat-background overflow-hidden">
		<div
			ref="chatScroll"
			class="flex flex-col px-4 py-12 gap-8 overflow-y-auto"
			@scrollend="onScroll"
		>
			<div class="flex flex-col gap-3" v-for="group in groupedTimeline" :key="group.date">
				<Divider class="my-20!" align="center" type="solid">
					<span class="bg-gray-200 text-gray-600 text-lg px-8 py-2 rounded-full">
						{{ dateLabel(group.date) }}
					</span>
				</Divider>

				<template v-for="(item) in group.items" :key="item.id">
					<div
						v-if="item.kind === 'activity'"
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
							:body="item.content ?? ''"
							:buttons="[]"
							:date="moment(item.created_at).format('h:mm A')"
							:status="item.status"
							:side="item.direction === 'inbound' ? 'left' : 'right'"
							:bubbleColor="item.direction === 'inbound' ? 'white' : 'sky'"
							:showTail="shouldShowTail(item, group.items)"
							:showOptions="item.direction === 'inbound'"
							:reply="getReply(item)"
							@onReply="replyMessage = item"
						/>

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
		</div>

		<div class="flex flex-col gap-3 mx-6 mb-8 shadow rounded-lg mt-auto">
			<ChatEditor
				:users="users"
				:loading="loading"
				:disable="disableReply"
				:customEvent="customEvent"
				:replyMessage="reply"
				@send="emit('onSendMessage', $event)"
				@customEvent="emit('onCustomEvent')"
				@onClearReply="replyMessage = undefined"
			/>
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