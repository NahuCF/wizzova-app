import Http from '~/config/http'
import type { AgentStatsResponse, DashboardData, DashboardFilters } from '~/types'

export default {
  async index(filters: DashboardFilters) {
    return Http.get<{ data: DashboardData }>('/dashboard', { params: filters })
  },

  async agentStats(filters: DashboardFilters) {
    return Http.get<{ data: AgentStatsResponse }>('/dashboard/agents', { params: filters })
  },
}
