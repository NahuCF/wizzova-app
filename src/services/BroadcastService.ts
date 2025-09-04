import type { Page, BroadcastItem, BroadcastOverview, WABANumber, BroadcastStatus } from '~/types'
import Http from '~/config/http'

interface BroadcastFilters {
    phone_number_id: string,
    page?: number,
    rows_per_page?: number,
    search?: string,
    start_date?: string,
    end_date?: string,
    status?: BroadcastStatus
}

interface BroadcastOverviewFilters { 
    phone_number_id: string,
    overview_days: number
}

export default {
    async index(filters: BroadcastFilters) {
        return Http.get<Page<BroadcastItem>>('/broadcasts', { params: filters })
    },
    async overview(filters: BroadcastOverviewFilters) {
        return Http.get<BroadcastOverview>('/broadcasts/overview', { params: filters })
    },
    async broadcastNumbers() {
        return Http.get<{ data: WABANumber[] }>('/phone-numbers')
    }
}
