<script setup lang="ts">
import EmojiPicker, { type EmojiExt } from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { IconMoodSmile, IconLoader2 } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n';
import type { MessageItem, UserItem } from '~/types'

const props = defineProps<{
	messages: MessageItem[],
	assignedUser?: UserItem,
	disableReply?: boolean,
	customEvent?: string,
	loading?: boolean,
}>()

const emit = defineEmits<{
	(e: 'onSendMessage', { message, type }: { message: string, type: 'REPLY' | 'NOTES' }): void
	(e: 'onCustomEvent'): void
}>()

const { t } = useI18n()

const inputTab = ref<'REPLY' | 'NOTES'>('REPLY')
const newMessage = ref('')
const emojiPopover = ref()

const groupedMessages = computed(() => {
    const groups: Record<string, MessageItem[]> = {}
    for (const msg of props.messages) {
        const dateKey = moment(msg.created_at).format('YYYY-MM-DD')
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(msg)
    }

    return Object.entries(groups)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([date, messages]) => ({ date, messages }))
})

const sendDisabled = computed(() => {
	const replyDisabled = props.disableReply && inputTab.value === 'REPLY'
	const emptyMessage = newMessage.value.length === 0
	const isCustomEvent = props.customEvent && inputTab.value === 'REPLY'

	const shouldDisable = props.loading || emptyMessage || replyDisabled

	return shouldDisable && !isCustomEvent
})

const dateLabel = (date: string) => {
    const m = moment(date)
    if (m.isSame(moment(), 'day')) return t('Today')
    if (m.isSame(moment().subtract(1, 'day'), 'day')) return t('Yesterday')
    if (m.isAfter(moment().subtract(7, 'days'))) return m.format('dddd')
    return m.format('MMM D, YYYY')
}

const shouldShowTail = (index: number, messages: MessageItem[]) => {
	if (index === 0) return true
	return messages[index].direction !== messages[index - 1].direction
}

const onSelectEmoji = (emoji: EmojiExt) => {
	newMessage.value += emoji.i
	emojiPopover.value?.hide()
}

const sendMessage = () => {
	emit('onSendMessage', {
		message: newMessage.value,
		type: inputTab.value
	})
	newMessage.value = ''
}
</script>

<template>
	<div class="flex flex-col flex-1 h-full chat-background overflow-hidden">
		<div class="flex flex-col px-4 py-12 gap-8 overflow-y-auto">
			<div class="flex flex-col gap-3" v-for="group in groupedMessages" :key="group.date">
				<Divider align="center" type="solid">
					<span class="bg-gray-200 text-gray-600 text-lg px-8 py-2 rounded-full">
						{{ dateLabel(group.date) }}
					</span>
				</Divider>

				<div 
					v-for="(message, index) in group.messages" :key="message.id"
					class="flex px-4 z-2"
					:class="message.direction === 'inbound' ? 'justify-start' : 'justify-end'"
				>
					<MessagePreview
						:body="message.content ?? ''"
						:buttons="[]"
						:date="moment(message.created_at).format('h:mm A')"
						:status="message.status"
						:side="message.direction === 'inbound' ? 'left' : 'right'"
						:bubbleColor="message.direction === 'inbound' ? 'white' : 'sky'"
						:showTail="shouldShowTail(index, group.messages)"
					/>

					<div 
						v-if="message.direction === 'outbound' && assignedUser" 
						class="pl-4 flex"
					>
						<Avatar
							v-if="shouldShowTail(index, group.messages)"
							:label="assignedUser.name.charAt(0).toLocaleUpperCase()"
							shape="circle"
						/>
						<div v-else class="pl-[24px]"></div>
					</div>
				</div>
			</div>
		</div>

		<div 
			class="flex flex-col gap-3 p-4 mx-6 mb-8 shadow rounded-lg mt-auto"
			:class="[inputTab === 'REPLY' ? 'bg-white' : 'bg-yellow-50']"
		>
			<Tabs v-model:value="inputTab" lazy>
				<TabList class="text-lg px-[3px]">
					<Tab value="REPLY">
						<div 
							class="flex justify-center items-center text-inherit"
						>
							{{ $t('Reply') }}
						</div>
					</Tab>
					<Tab value="NOTES">
						<div 
							class="flex justify-center items-center text-inherit"
						>
							{{ $t('Notes') }}
						</div>
					</Tab>
				</TabList>
			</Tabs>

			<Textarea 
				v-model="newMessage"
				fluid 
				class="text-lg!"
				:class="[inputTab === 'REPLY' ? 'bg-white' : 'bg-yellow-50!']"
				:maxlength="1024"
				:placeholder="inputTab === 'REPLY' ? $t('Message Alexis') : $t('Add your private notes')"
				variant="outlined"
				size="large"
				:disabled="disableReply && inputTab === 'REPLY'"
			/>

			<div class="flex justify-between items-center">
				<Button variant="text" @click="emojiPopover?.toggle($event)">
					<IconMoodSmile size="18" />
				</Button>

				<Popover ref="emojiPopover" :dismissable="true" unstyled class="">
					<EmojiPicker :native="true" @select="onSelectEmoji" />
				</Popover>
					
				<Button
					:disabled="sendDisabled"
					@click="() => customEvent ? emit('onCustomEvent') : sendMessage()"
				>
					<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
					<span v-else-if="customEvent && inputTab === 'REPLY'">
						{{ customEvent }}
					</span>
					<span v-else>
						{{ $t('Send') }}
					</span>
				</Button>
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