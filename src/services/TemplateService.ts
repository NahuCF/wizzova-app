import Http from '~/config/http'
import type {
  Page,
  TemplateBroadcast,
  TemplateCreate,
  TemplateEdit,
  TemplateItem,
  TemplateStatus,
} from '~/types'

type TemplateFilters = {
  page?: number
  name?: string
  perPage?: number
  status?: TemplateStatus
}

export default {
  async index(filters: TemplateFilters) {
    const params: Record<string, string | number> = {
      page: filters.page || 1,
      rows_per_page: filters.perPage || 12,
      ...(filters.name && { name: filters.name }),
      ...(filters.status && { status: filters.status }),
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
  },
}
