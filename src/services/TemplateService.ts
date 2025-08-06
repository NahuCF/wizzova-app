import Http from '~/config/http'
import type { Page, TemplateBroadcast, TemplateCreate, TemplateEdit, TemplateItem } from '~/types'

export default {
	async index(page: number = 1, name: string = '', perPage: number = 12) {
		const params: Record<string, string | number> = {
			page,
			...(name && { name }),
			rows_per_page: perPage
		}

		return Http.get<Page<TemplateItem>>('/templates', { params })
	},
	async get(id: string) {
		return Http.get<{ data: TemplateEdit }>(`/templates/${id}`)
	},
	async create(template: TemplateCreate) {
		return Http.post<{ data: TemplateItem }>('/templates', template)
	},
	async update(template: TemplateCreate) {
		return Http.put<{ data: TemplateItem }>(`/templates/${template.id}`, template)
	},
	async delete(id: string) {
        return Http.delete(`/templates/${id}`)
    },
	async activeBroadcasts(id: string) {
		return Http.get<{ data: TemplateBroadcast[] }>(`/templates/${id}/active-broadcasts`)
	}
}
