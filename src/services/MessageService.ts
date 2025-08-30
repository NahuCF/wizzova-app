import Http from '~/config/http'
import type { CreateMessage, MessageItem, Page } from '~/types'

type MessageFilters = {
	page?: number
	rows_per_page?: number
	conversation_id: string
}

export default {
    async index({
		page,
		rows_per_page,
		conversation_id
	}: MessageFilters) {
		const params = {
			page: page ? page : 1,
			rows_per_page: rows_per_page ? rows_per_page : 10,
			conversation_id
		}

        return Http.get<Page<MessageItem>>('/messages', { params })
    },
    async create(conversation: CreateMessage) {
        return Http.post<{ data: MessageItem }>('/messages', conversation)
    }
}
