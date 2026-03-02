import Http from '~/config/http'
import type { DashboardData, DashboardFilters } from '~/types'

export default {
  async index(filters: DashboardFilters) {
    return Http.get<{ data: DashboardData }>('/dashboard', { params: filters })
  },
}
