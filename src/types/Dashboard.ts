export interface DashboardOverview {
  open_conversations: number
  resolved_conversations: number
  total_conversations: number
  new_contacts: number
  user_initiated: number
  business_initiated: number
}

export interface TimeSeriesPoint {
  period: string
  count: number
}

export interface MessageStatusTimeSeriesPoint {
  period: string
  sent: number
  delivered: number
  read: number
  failed: number
}

export interface CategoryTimeSeriesPoint {
  period: string
  user: number
  business: number
}

export interface DashboardData {
  overview: DashboardOverview
  conversations_chart?: TimeSeriesPoint[]
  contacts_chart?: TimeSeriesPoint[]
  messages_chart?: MessageStatusTimeSeriesPoint[]
  category_chart?: CategoryTimeSeriesPoint[]
}

export interface DashboardFilters {
  start_date?: string
  end_date?: string
}

export interface AgentStatsItem {
  id: string
  name: string
  email: string
  profile_img_path?: string | null
  active_conversations: number
  resolved: number
  messages_sent: number
  avg_resolution_time_minutes: number | null
  avg_first_response_time_minutes: number | null
}

export interface AgentStatsSummary {
  total_active_conversations: number
  total_resolved: number
  total_messages_sent: number
  avg_resolution_time_minutes: number | null
  avg_first_response_time_minutes: number | null
}

export interface AgentStatsResponse {
  summary: AgentStatsSummary
  agents: AgentStatsItem[]
}
