import type { PrimeVueSeverity } from "./PrimeVueDef"
import type { UserItem } from "./User"

export type BotStatus = 'draft' | 'active' | 'archived'
export type BotTriggerType = 'any_message' | 'keyword'
export type BotMatchType = 'exact' | 'contains' | 'regex'

export interface BotItem {
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

export type BotKeyword = {
	keyword: string,
	match_type: BotMatchType,
	case_sensitive: boolean,
	showAdvanced?: boolean
}

export interface BotCreate {
	id: string,
	name: string
	trigger_type: BotTriggerType
	keywords: BotKeyword[]
}

export interface BotTriggerTag {
	label: string
	tooltip?: string
	color?: PrimeVueSeverity
}