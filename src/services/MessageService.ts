import Http from '~/config/http'
import type { CreateMessage, MessageItem, Page } from '~/types'

type MessageFiltersBase = {
	page?: number
	rows_per_page?: number
}

type MessageFilters =
	| (MessageFiltersBase & { conversation_id: string; broadcast_id?: never })
	| (MessageFiltersBase & { broadcast_id: string; conversation_id?: never })

export default {
    async index({
		page,
		rows_per_page,
		conversation_id,
		broadcast_id
	}: MessageFilters) {
		const params = {
			page: page ?? 1,
			rows_per_page: rows_per_page ?? 10,
			conversation_id,
			broadcast_id
		}

        return Http.get<Page<MessageItem>>('/messages', { params })
    },
    async create(conversation: CreateMessage) {
        return Http.post<{ data: MessageItem }>('/messages', conversation)
    }
}
