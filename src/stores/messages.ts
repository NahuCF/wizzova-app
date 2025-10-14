import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '~/services'
import type { MessageDeleted, MessageItem, Page, TemplateItem } from '~/types'

export type MessagePagination = {
	pages: Record<number, MessageItem[]>
	meta: Page<MessageItem>['meta']
	loadedPages: Set<number>
	loading: boolean
}

export const useMessagesStore = defineStore('messages', () => {
	const messagesPaginationByConversation = ref<Record<string, MessagePagination>>({})
	const perPage = ref(15)
	const templates = ref<Record<string, TemplateItem>>({})
	const lastDeletedMessage = ref<MessageDeleted | null>(null)

	const initConversationPagination = (conversationId: string) => {
		if (!messagesPaginationByConversation.value[conversationId]) {
			messagesPaginationByConversation.value[conversationId] = {
				pages: {},
				meta: {
					current_page: 1,
					last_page: 1,
					total: 0,
					links: [],
					from: 0,
					path: '',
					per_page: 0,
					to: 0,
				},
				loadedPages: new Set(),
				loading: false,
			}
		}
		return messagesPaginationByConversation.value[conversationId]
	}

	const ensureTemplatesForMessages = async (messages: MessageItem[]) => {
		const missingTemplateIds = Array.from(
			new Set(
				messages
					.filter(m => m.template_id && !templates.value[m.template_id])
					.map(m => m.template_id as string)
			)
		)

		if (missingTemplateIds.length === 0) return

		await Promise.all(
			missingTemplateIds.map(async (id) => {
				try {
					const { data: response } = await API.template.get(id)
					templates.value[id] = {
						...response.data,
						days_since_meta_update: 0,
						updated_count_while_approved: 0
					}
				} catch (err) {
					console.error(`Failed to load template ${id}`, err)
				}
			})
		)
	}

	const ensurePage = async (conversationId: string, page: number) => {
		const pag = initConversationPagination(conversationId)
		if (pag.loadedPages.has(page) || pag.loading) return

		pag.loading = true
		try {
			const { data: response } = await API.message.index({
				conversation_id: conversationId,
				page,
				rows_per_page: perPage.value
			})
			pag.pages[page] = response.data
			pag.meta = response.meta
			pag.loadedPages.add(page)

			await ensureTemplatesForMessages(response.data)
		} finally {
			pag.loading = false
		}
	}

	const loadInitialPage = async (conversationId: string) => {
		await ensurePage(conversationId, 1)
	}

	const loadOlderMessages = async (conversationId: string) => {
		const pag = messagesPaginationByConversation.value[conversationId]
		if (!pag?.meta) return

		const maxLoaded = Math.max(...pag.loadedPages)
		if (maxLoaded < pag.meta.last_page) {
			await ensurePage(conversationId, maxLoaded + 1)
		}
	}

	const jumpToMessage = async (conversationId: string, targetPage: number, positionFromEnd: number) => {
		await ensurePage(conversationId, targetPage)

		return {
			page: targetPage,
			positionFromEnd: positionFromEnd,
		}
	}

	const getMessagesForConversation = (conversationId: string) => {
		const pag = messagesPaginationByConversation.value[conversationId]
		if (!pag) return []

		return Object.keys(pag.pages)
			.map(Number)
			.sort((a, b) => a - b)
			.map(page => pag.pages[page])
			.flat()
	}

	const $reset = () => {
		messagesPaginationByConversation.value = {}
		perPage.value = 15
		templates.value = {}
		lastDeletedMessage.value = null
	}

	return {
		messagesPaginationByConversation,
		templates,
		lastDeletedMessage,
		$reset,
		ensurePage,
		loadInitialPage,
		loadOlderMessages,
		jumpToMessage,
		getMessagesForConversation,
		initConversationPagination,
		ensureTemplatesForMessages
	}
})
