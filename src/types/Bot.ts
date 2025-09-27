import type { PrimeVueSeverity } from "./PrimeVueDef"

export type BotStatus = 'draft' | 'active' | 'archived'
export type BotTriggerType = 'any_message' | 'keyword'
export type BotMatchType = 'exact' | 'contains' | 'regex'

export interface BotItem {
	id: string
	name: string
	trigger_type: BotTriggerType
	keywords?: string[]
	keyword_match_type?: BotMatchType
	sessions: number
	completed_percentage: number
	abandoned_percentage: number
	status: BotStatus
	created_by: { id: string; name: string }
	updated_by?: { id: string; name: string }
	created_at: string
	updated_at: string
}

export interface CreateBot {
	name: string
	trigger_type: BotTriggerType
	keywords?: string[]
	keyword_match_type?: BotMatchType
}

export interface BotTriggerTag {
	label: string
	tooltip?: string
	color?: PrimeVueSeverity
}