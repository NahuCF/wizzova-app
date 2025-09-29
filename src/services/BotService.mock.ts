import { AxiosHeaders, type AxiosResponse } from 'axios'
import type { Page, PaginationLinks, PaginationMeta, PaginationMetaLink } from "~/types"
import type { BotItem, BotMatchType, BotStatus, BotTriggerType, BotCreate } from "~/types/Bot"


/* ---------- Helpers ---------- */
function randomId() {
	return Math.random().toString(36).slice(2, 10)
}
function randomDate() {
	const now = Date.now()
	const offset = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)
	return new Date(now - offset).toISOString()
}
function sample<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

/* ---------- Fake Store ---------- */
const STATUSES: BotStatus[] = ['draft', 'active', 'archived']
const TRIGGERS: BotTriggerType[] = ['any_message', 'keyword']
const MATCH_TYPES: BotMatchType[] = ['exact', 'contains', 'regex']

let bots: BotItem[] = Array.from({ length: 25 }).map((_, i) => {
	const trigger_type = sample(TRIGGERS)
	const keywords =
		trigger_type === 'keyword'
			? ['hola', 'demo', 'quiero saber más', 'info', 'test', 'porque'].slice(0, Math.floor(Math.random() * 5) + 1)
				.map(val => ({ value: val, case_match: false }))
			: undefined
	return {
		id: randomId(),
		name: `Fake Bot ${i + 1}`,
		trigger_type,
		keywords,
		keyword_match_type: keywords ? sample(MATCH_TYPES) : undefined,
		sessions: Math.floor(Math.random() * 500),
		completed_percentage: Math.floor(Math.random() * 100),
		abandoned_percentage: Math.floor(Math.random() * 100),
		status: sample(STATUSES),
		created_by: { id: randomId(), name: 'Alice Doe' },
		updated_by: { id: randomId(), name: 'Bob Smith' },
		created_at: randomDate(),
		updated_at: randomDate(),
	}
})

/* ---------- Pagination Builder ---------- */
function buildPaginationMeta(
	total: number,
	perPage: number,
	currentPage: number,
	basePath = '/bots'
): { links: PaginationLinks; meta: PaginationMeta } {
	const lastPage = Math.max(1, Math.ceil(total / perPage))
	const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1
	const to = Math.min(total, currentPage * perPage)

	const pageLink = (p: number) => `${basePath}?page=${p}`

	const metaLinks: PaginationMetaLink[] = []
	for (let i = 1; i <= lastPage; i++) {
		metaLinks.push({ url: pageLink(i), label: i.toString(), active: i === currentPage })
	}

	return {
		links: {
			first: pageLink(1),
			last: pageLink(lastPage),
			prev: currentPage > 1 ? pageLink(currentPage - 1) : null,
			next: currentPage < lastPage ? pageLink(currentPage + 1) : null,
		},
		meta: {
			current_page: currentPage,
			from,
			last_page: lastPage,
			links: metaLinks,
			path: basePath,
			per_page: perPage,
			to,
			total,
		},
	}
}

/* ---------- Mock Service ---------- */
export default {
	async index({
		page = 1,
		rows_per_page = 10,
		search,
		status,
		trigger_type,
	}: {
		page?: number
		rows_per_page?: number
		search?: string
		status?: BotStatus
		trigger_type?: BotTriggerType
	}): Promise<{ data: Page<BotItem> }> {
		let filtered = [...bots]
		if (search) {
			filtered = filtered.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
		}
		if (status) filtered = filtered.filter(b => b.status === status)
		if (trigger_type) filtered = filtered.filter(b => b.trigger_type === trigger_type)

		const total = filtered.length
		const start = (page - 1) * rows_per_page
		const end = start + rows_per_page
		const { links, meta } = buildPaginationMeta(total, rows_per_page, page)

		return {
			data: {
				data: filtered.slice(start, end),
				links,
				meta,
			}
		}
	},

	async create(payload: BotCreate) {
		const newBot: BotItem = {
			id: randomId(),
			name: payload.name,
			trigger_type: payload.trigger_type,
			keywords: payload.trigger_type === 'keyword' ? payload.keywords ?? [] : undefined,
			sessions: 0,
			completed_percentage: 0,
			abandoned_percentage: 0,
			status: 'draft',
			created_by: { id: randomId(), name: 'You' },
			updated_by: { id: randomId(), name: 'You' },
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}
		bots.unshift(newBot)

		const headers = new AxiosHeaders({ "content-type": "application/json" });

		const response = {
			data: newBot,
			status: 200,
			statusText: "OK",
			headers,
			config: {},
			request: {},
		} as AxiosResponse

		return response
	},

	async activate(id: string) {
		const bot = bots.find(b => b.id === id)
		if (!bot) throw new Error('Bot not found')
		bot.status = 'active'
		bot.updated_at = new Date().toISOString()
		return { data: bot }
	},

	async clone(id: string) {
		const bot = bots.find(b => b.id === id)
		if (!bot) throw new Error('Bot not found')
		const cloned: BotItem = {
			...bot,
			id: randomId(),
			name: `${bot.name} (Clone)`,
			status: 'draft',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		}
		bots.unshift(cloned)
		return { data: cloned }
	},

	async get(id: string) {
		const bot = bots.find(b => b.id === id)
		if (!bot) throw new Error('Bot not found')
		return { data: bot }
	},
}