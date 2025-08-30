import Http from '~/config/http'
import type { ConversationItem, CreateConversation, Page } from '~/types'

type ConversationFilters = {
	page?: number
	rows_per_page?: number
	search?: string
	search_type?: 'contact' | 'message'
	user_id?: string,
	only_unassigned?: boolean,
	only_pinned?: boolean,
	only_solved?: boolean,
	only_opened?: boolean,
}

export default {
    async index({ 
		only_unassigned,
		only_pinned,
		only_solved,
		only_opened,
		search_type,
		search,
		...props
	}: ConversationFilters) {
		const params = {
			...props,
			search,
			search_type: search_type && search ? search_type : undefined,
			only_unassigned: only_unassigned ? 1 : undefined,
			only_pinned: only_pinned ? 1 : undefined,
			only_solved: only_solved ? 1 : undefined,
			only_opened: only_opened ? 1 : undefined,
		}

        return Http.get<Page<ConversationItem>>('/conversations', { params })
    },
    async create(conversation: CreateConversation) {
        return Http.post<{ data: ConversationItem }>('/conversations', conversation)
    }
}
