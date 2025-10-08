import { nextTick, type Ref } from 'vue'
import type { MessageItem } from '~/types'
import type { MessagePagination, useMessagesStore } from '~/stores/messages'

interface ChatScrollProps {
	conversationId?: string
	messages: MessageItem[]
}

export type ChatEmit = {
	(e: 'onSendMessage', payload: {
		message: string
		type: 'REPLY' | 'NOTES'
		mentions: Record<string, string>[]
		replyId?: string
	}): void
	(e: 'onCustomEvent'): void
	(e: 'scrollTopReached'): void
	(e: 'scrollBottomReached'): void
}

type MessagesStore = ReturnType<typeof useMessagesStore>

export function useChatScroll(
	chatScroll: Ref<HTMLDivElement | undefined>,
	props: ChatScrollProps,
	messagesStore: MessagesStore,
	isJumpingToMessage: Ref<boolean>,
	messagePagination: Ref<MessagePagination | null>
) {
	const scrollToBottom = (smooth: boolean = true): void => {
		const el = chatScroll.value
		if (!el) return

		el.scrollTo({
			top: el.scrollHeight,
			behavior: smooth ? 'smooth' : 'auto'
		})
	}

	const handleTopBottomReached = (el: HTMLElement, emit: ChatEmit): void => {
		const threshold = 10
		const isAtBottom = Math.abs(el.scrollTop) <= threshold
		const isAtTop = Math.abs(el.scrollTop) + el.clientHeight >= el.scrollHeight - threshold

		if (isAtTop) emit('scrollTopReached')
		if (isAtBottom) emit('scrollBottomReached')
	}

	const isFirstMessageOfPage = (messageId: string): boolean => {
		const pag = messagePagination.value
		if (!pag) return false
		return Object.values(pag.pages).some(messages => messages[0]?.id === messageId)
	}

	const getMessagePage = (messageId: string): number | null => {
		const pag = messagePagination.value
		if (!pag) return null

		for (const [page, messages] of Object.entries(pag.pages)) {
			if (messages.find(m => m.id === messageId)) {
				return Number(page)
			}
		}
		return null
	}

	const placeholderForMissingPage = (messageId: string): number | null => {
		const pag = messagePagination.value
		if (!pag || !pag.meta.last_page) return null

		const missingPages = Array.from({ length: pag.meta.last_page }, (_, i) => i + 1)
			.filter(page => !pag.loadedPages.has(page))

		if (!missingPages.length) return null
		if (!isFirstMessageOfPage(messageId)) return null

		const messagePage = getMessagePage(messageId)
		if (!messagePage) return null

		return missingPages.find(p => p + 1 === messagePage) || null
	}

	const loadVisibleMissingPages = (): void => {
		if (isJumpingToMessage.value || !props.conversationId) return

		const el = chatScroll.value
		if (!el) return

		const placeholders = el.querySelectorAll<HTMLElement>('[data-missing-page]')
		placeholders.forEach(ph => {
			const page = Number(ph.dataset.missingPage)
			if (!page) return

			const pag = messagePagination.value
			if (!pag || pag.loadedPages.has(page)) return

			const rect = ph.getBoundingClientRect()
			const containerRect = el.getBoundingClientRect()
			if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
				messagesStore.ensurePage(props.conversationId!, page)
			}
		})
	}

	const onScroll = (emit: ChatEmit): void => {
		const el = chatScroll.value
		if (!el) return
		handleTopBottomReached(el, emit)
		loadVisibleMissingPages()
	}

	const maintainScrollForTopLoad = async (): Promise<void> => {
		const el = chatScroll.value
		if (!el) return

		const previousScrollTop = el.scrollTop
		await nextTick()
		el.scrollTop = previousScrollTop
	}

	const scrollToMessage = async (messageId: string): Promise<void> => {
		const el = chatScroll.value
		if (!el) return

		isJumpingToMessage.value = true
		await nextTick()

		const messageEl = el.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`)
		if (messageEl) {
			messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
		}

		setTimeout(() => {
			isJumpingToMessage.value = false
		}, 1000)
	}

	return {
		scrollToBottom,
		onScroll,
		placeholderForMissingPage,
		maintainScrollForTopLoad,
		scrollToMessage,
		isFirstMessageOfPage,
		getMessagePage
	}
}
