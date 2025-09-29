import Http from "~/config/http"
import type { Page } from "~/types"
import type { BotItem, BotCreate } from "~/types/Bot"

type BotFilters = {
	page?: number
	rows_per_page?: number
	search?: string
}

export default {
	async index({ page, rows_per_page, search }: BotFilters) {
		const params = {
			page,
			rows_per_page,
			search
		}
		return Http.get<Page<BotItem>>('/bots', { params })
	},
	async create(payload: BotCreate) {
		return Http.post<{ data: BotItem }>('/bots', payload)
	},
	async activate(id: string) {
		return Http.put<{ data: BotItem }>(`/bots/${id}/activate`)
	},
	async clone(id: string) {
		return Http.post<{ data: BotItem }>(`/bots/${id}/clone`)
	},
	async get(id: string) {
		return Http.get<{ data: BotItem }>(`/bots/${id}`)
	},
}