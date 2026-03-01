import Http from '~/config/http'
import type {
  ConversationActivity,
  ConversationExists,
  ConversationItem,
  ConversationStats,
  ConversationStatus,
  CreateConversation,
  Page,
} from '~/types'

export type ConversationFilters = {
  page?: number
  rows_per_page?: number
  search?: string
  search_type?: 'contact' | 'message'
  user_id?: string
  only_unassigned?: boolean
  only_pinned?: boolean
  only_solved?: boolean
  only_opened?: boolean
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
  async stats(status: ConversationStatus) {
    return Http.post<{ data: ConversationStats }>('/conversations/stats', { view: status })
  },
  async get(id: string) {
    return Http.get<{ data: ConversationItem }>(`/conversations/${id}`)
  },
  async activities(id: string) {
    return Http.get<{ data: ConversationActivity[] }>(`/conversations/${id}/activities`)
  },
  async create(conversation: CreateConversation) {
    return Http.post<{ data: ConversationItem } | ConversationExists>(
      '/conversations',
      conversation,
    )
  },
  async changeSolved(id: string, is_solved: boolean) {
    return Http.put<{ data: ConversationItem }>(`/conversations/${id}/change-solved`, {
      is_solved,
    })
  },
  async changeOwner(id: string, user_id?: string) {
    return Http.put<{ data: ConversationItem }>(`/conversations/${id}/change-owner`, {
      user_id,
    })
  },
  async pin(id: string) {
    return Http.post<{ data: ConversationItem }>(`/conversations/${id}/pin`)
  },
  async unpin(id: string) {
    return Http.delete<{ data: ConversationItem }>(`/conversations/${id}/pin`)
  },
  async markAsRead(id: string) {
    return Http.post<{ data: ConversationItem }>(`/conversations/${id}/mark-as-read`)
  },
}
