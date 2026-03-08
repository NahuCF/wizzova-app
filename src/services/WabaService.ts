import Http from '~/config/http'
import type { WABAItem } from '~/types'

export default {
  async index(businessId?: string) {
    return Http.get<{ data: WABAItem[] }>('/wabas', {
      params: businessId ? { business_id: businessId } : undefined,
    })
  },
}
