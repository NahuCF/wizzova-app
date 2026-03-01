import type { PrimeVueSeverity } from './PrimeVueDef'
import type { UserItem } from './User'

export type BotStatus = 'draft' | 'active' | 'archived'
export type BotTriggerType = 'any_message' | 'keyword'
export type BotMatchType = 'exact' | 'contains' | 'regex'

export type BotItem = BotConfiguration & {
  id: string
  name: string
  trigger_type: BotTriggerType
  keywords?: BotKeyword[]
  total_sessions: number
  completed_sessions: number
  abandoned_sessions: number
  status: BotStatus
  created_by?: UserItem
  updated_by?: UserItem
  created_at: string
  updated_at: string
}

export type BotActiveSessions = {
  total_active_sessions: number
  has_active_sessions: boolean
  waba_names: string[]
}

export type BotKeyword = {
  keyword: string
  match_type: BotMatchType
  case_sensitive: boolean
  showAdvanced?: boolean
}

export interface BotCreate {
  id: string
  name: string
  trigger_type: BotTriggerType
  keywords: BotKeyword[]
}

export interface BotTriggerTag {
  label: string
  tooltip?: string
  color?: PrimeVueSeverity
}

export type BotAnalyticsFilters = {
  start_date: string
  end_date: string
}

export type BotAnalytics = {
  overview: {
    active_sessions: number
    total_sessions: number
    completed_sessions: number
    abandoned_sessions: number
    avg_duration_seconds: number
  }
  time_series: {
    period: string
    opened_sessions: number
    unique_users: number
    completed_sessions: number
    abandoned_sessions: number
    avg_duration_seconds: number
  }[]
}

export type BotAction = 'no_action' | 'unassign' | 'assign_user' | 'assign_bot' | 'message'

export type BotConfiguration = {
  name: string
  wait_time_minutes: number
  timeout_action: BotAction
  timeout_assign_bot_id?: string
  timeout_assign_user_id?: string
  timeout_message?: string
  no_match_action: BotAction
  no_match_assign_bot_id?: string
  no_match_assign_user_id?: string
  no_match_message?: string
  end_conversation_action: BotAction
  end_conversation_message?: string
  end_conversation_assign_bot_id?: string
  end_conversation_assign_user_id?: string
  about_to_end_time_minutes?: number
  about_to_end_action: BotAction
  about_to_end_message?: string
  about_to_end_assign_bot_id?: string
  about_to_end_assign_user_id?: string
}
