import Http from '~/config/http'
import type { Page, TemplateCreate, TemplateItem } from '~/types'

export default {
  async index(page: number = 1, name: string = '', perPage: number = 12) {
    const params: Record<string, string | number> = { 
      page,
      ...(name && { name }),
      rows_per_page: perPage
    }

    return Http.get<Page<TemplateItem>>('/templates',  { params })
  },
  async store(payload: TemplateCreate) {
    return Http.post('/templates', payload)
  },
}
