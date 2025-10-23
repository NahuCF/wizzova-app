import Http from "~/config/http"
import type { BotActiveSessions, BotAnalytics, BotAnalyticsFilters, BotConfiguration, Page } from "~/types"
import type { BotItem, BotCreate } from "~/types"

type BotFilters = {
	page?: number
	rows_per_page?: number
	search?: string,
	with_relationships?: boolean,
	columns?: string[]
}

export default {
	async index(filters: BotFilters) {
		const params = { 
			...filters,
			...(filters.with_relationships !== undefined ? { with_relationships: 1 } : { with_relationships: 0 })
		}

		return Http.get<Page<BotItem>>('/bots', { params })
	},
	async indexWithoutPagination(filters: BotFilters) {
		const params = { 
			...filters,
			should_paginate: 0,
			...(filters.with_relationships !== undefined ? { with_relationships: 1 } : { with_relationships: 0 })
		}

		return Http.get<{ data: BotItem[] }>('/bots', { params })
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
	async activeSessions(id: string) {
		return Http.get<BotActiveSessions>(`/bots/${id}/active-sessions`)
	},
	async delete(id: string) {
		return Http.delete<{ data: BotItem }>(`/bots/${id}`)
	},
	async analytics(id: string, filters: BotAnalyticsFilters) {
		return Http.get<{ data: BotAnalytics }>(`/bots/${id}/analytics`, {
			params: filters
		})
	},
	async configuration(id: string, configuration: BotConfiguration) {
		return Http.put<{ data: BotItem }>(`/bots/${id}/configuration`, configuration)
	},
}