import Http from '~/config/http'
import type { DashboardFilters, Page, UserActivityLogItem, UserAnalyticsData } from '~/types'

export default {
  async index(userId: string, filters: DashboardFilters) {
    return Http.get<{ data: UserAnalyticsData }>(`/users/${userId}/analytics`, { params: filters })
  },

  async activityLogs(
    userId: string,
    page: number,
    rowsPerPage: number,
    filters: DashboardFilters,
  ) {
    return Http.get<Page<UserActivityLogItem>>(`/users/${userId}/activity-logs`, {
      params: { ...filters, page, rows_per_page: rowsPerPage },
    })
  },
}
