import type {
  Page,
  BroadcastItem,
  BroadcastOverview,
  WABANumber,
  BroadcastStatus,
  BroadcastFilters,
  BroadcastOverviewFilters,
  BroadcastCreate,
  BroadcastDetail,
  BroadcastRepeat,
} from '~/types'
import Http from '~/config/http'

export default {
  async index(filters: BroadcastFilters) {
    return Http.get<Page<BroadcastItem>>('/broadcasts', { params: filters })
  },
  async overview(filters: BroadcastOverviewFilters) {
    return Http.get<BroadcastOverview>('/broadcasts/overview', { params: filters })
  },
  async create(broadcast: BroadcastCreate) {
    return Http.post<{ data: BroadcastItem }>('/broadcasts', broadcast)
  },
  async updateStatus(broadcastId: string, status: BroadcastStatus) {
    return Http.post<{ data: BroadcastItem }>(`/broadcasts/${broadcastId}/update-status`, {
      status: status,
    })
  },
  async get(id: string) {
    return Http.get<{ data: BroadcastDetail }>(`/broadcasts/${id}`)
  },
  async repeat(id: string, payload: BroadcastRepeat) {
    return Http.post<{ data: BroadcastItem }>(`/broadcasts/${id}/repeat`, payload)
  },
  async recipientsCount(groupIds: string[], sendToAllNumbers: boolean) {
    return Http.post<{ recipients_count: number }>('/broadcasts/recipients-count', {
      group_ids: groupIds,
      send_to_all_numbers: sendToAllNumbers,
    })
  },
  async broadcastNumbers(wabaId: string) {
    return Http.get<{ data: WABANumber[] }>('/phone-numbers', {
      params: { waba_id: wabaId },
    })
  },
}
