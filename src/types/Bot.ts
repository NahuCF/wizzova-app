import type { PrimeVueSeverity } from "./PrimeVueDef"

export type BotStatus = 'draft' | 'active' | 'archived'
export type BotTriggerType = 'any_message' | 'keyword'
export type BotMatchType = 'exact' | 'contains' | 'regex'

export interface BotItem {
	id: string
	name: string
	trigger_type: BotTriggerType
	keywords?: {
		value: string,
		case_match: boolean
	}[]
	sessions: number
	completed_percentage: number
	abandoned_percentage: number
	status: BotStatus
	created_by: { id: string; name: string }
	updated_by?: { id: string; name: string }
	created_at: string
	updated_at: string
}

export interface BotCreate {
	id: string,
	name: string
	trigger_type: BotTriggerType
	keywords?: {
		value: string,
		case_match: boolean
	}[]
}

export interface BotTriggerTag {
	label: string
	tooltip?: string
	color?: PrimeVueSeverity
}