import Http from "~/config/http"
import type { BotAnalytics, BotAnalyticsFilters, BotConfiguration, Page } from "~/types"
import type { BotItem, BotCreate } from "~/types"

type BotFilters = {
	page?: number
	rows_per_page?: number
	search?: string
}

export default {
	async index({ page, rows_per_page, search }: BotFilters) {
		const params: BotFilters = {
			page,
			rows_per_page
		}

		if(search) {
			params.search = search
		}
		
		return Http.get<Page<BotItem>>('/bots', { params })
	},
	async create(payload: BotCreate) {
		return Http.post<{ data: BotItem }>('/bots', payload)
	},
	async clone(id: string, name: string) {
		return Http.post<{ data: BotItem }>(`/bots/${id}/clone`, { name })
	},
	async get(id: string) {
		return Http.get<{ data: BotItem }>(`/bots/${id}`)
	},
	async analytics(id: string, filters: BotAnalyticsFilters) {
		return Http.get<{ data: BotAnalytics }>(`/bots/${id}`, {
			params: filters
		})
	},
	async configuration(id: string, configuration: BotConfiguration) {
		return Http.put<{ data: BotConfiguration }>(`/bots/${id}/configuration`, configuration)
	},
}