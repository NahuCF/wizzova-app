import type { Page, BroadcastItem, BroadcastOverview, WABANumber, BroadcastStatus, BroadcastFilters, BroadcastOverviewFilters, BroadcastCreate, BroadcastDetail } from '~/types'
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
            status: status
        })
    },
    async get(id: string) {
		return Http.get<{ data: BroadcastDetail }>(`/broadcasts/${id}`)
	},
    async broadcastNumbers() {
        return Http.get<{ data: WABANumber[] }>('/phone-numbers')
    }
}
