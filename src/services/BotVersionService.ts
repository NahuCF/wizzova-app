import Http from "~/config/http"
import type { Page } from "~/types"
import type { BotVersionItem, CreateBotVersion, BotStatus, BotVersionData } from "~/types"

type BotVersionFilters = {
	page?: number
	rows_per_page?: number
	search?: string
}

export default {
	async index(id: string, { page, rows_per_page, search }: BotVersionFilters) {
		const params: BotVersionFilters = {
			page,
			rows_per_page
		}

		if(search) {
			params.search = search
		}
		
		return Http.get<Page<BotVersionItem>>(`/bots/${id}/flows`, { params })
	},
	async create(id: string, payload: CreateBotVersion) {
		return Http.post<{ data: BotVersionItem }>(`/bots/${id}/flows`, payload)
	},
	async update(id: string, payload: CreateBotVersion) {
		return Http.put<{ data: BotVersionItem }>(`/bots/${id}/flows/${payload.id}`, payload)
	},
	async delete(id: string, versionId: string) {
		return Http.delete<{ data: BotVersionItem }>(`/bots/${id}/flows/${versionId}`)
	},
	async changeStatus(id: string, versionId: string, status: BotStatus) {
		return Http.put<{ data: BotVersionItem }>(`/bots/${id}/flows/${versionId}/status`, { status })
	},
	async get(id: string) {
		return Http.get<{ data: BotVersionItem }>(`/bots/${id}/flows`)
	},
	async getData(id: string, versionId: string) {
		return Http.get<{ data: BotVersionData }>(`/bots/${id}/flows/${versionId}/data`)
	},
}