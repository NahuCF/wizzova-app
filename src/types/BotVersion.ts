import type { BotStatus } from "./Bot"
import type { FilterOperator } from "./Common"
import type { PaginationMeta, Page } from "./Pagination"
import type { UserItem } from "./User"

export type BotVersionItem = {
	id: string,
	bot_id: string,
	name: string,
	total_sessions: number,
	completed_sessions: number,
	abandoned_sessions: number,
	active_sessions_count: number,
	nodes_count: number,
	edges_count: number,
	status: BotStatus,
	created_by?: UserItem,
	updated_by?: UserItem,
	created_at: string,
	updated_at: string
}

export type BotNodeType =
  | 'starting_node'
  | 'message'
  | 'template'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'question_button'
  | 'condition'
  | 'start_again'
  | 'mark_as_solved'
  | 'assign_chat'
  | 'location'
  | 'working_hours'
  | 'set_variable'

export type BotNode = {
	id: string,
	position: {
		x: number,
		y: number
	}
} & (
	{
		[K in keyof BotNodeDataMap]: {
			type: K,
			data: BotNodeDataMap[K]
		}
	}[keyof BotNodeDataMap]
)

export type BotEdge = {
	id: string,
	source: string,
	target: string,
	data?: {
		option_id?: string,
		condition_value?: string,
		is_default?: boolean
	}
}

export type BotViewport = {
	x: number,
	y: number,
	zoom: number
}

export type CreateBotVersion = {
	id: string,
	name: string,
	nodes: BotNode[],
	edges: BotEdge[],
	viewport?: BotViewport
}

export type BotVersionData = {
	id: string,
	name: string,
	status: BotStatus,
	nodes: BotNode[],
	edges: BotEdge[],
	viewport?: BotViewport,
	created_by?: UserItem,
	updated_by?: UserItem,
	created_at: string,
	updated_at: string
}

export interface PaginationMetaWithBotVersion extends PaginationMeta {
  	has_active_version: boolean
}

export interface PageWithBotVersion<T> extends Page<T> {
  	meta: PaginationMetaWithBotVersion
}

// Bot Node Type Definitions

type StartingNodeData = {}

type StartAgainNodeData = {}

type MarkAsSolvedNodeData = {}

type WorkingHoursNodeData = {}

type MessageNodeData = {
	content: string
}

type TemplateNodeData = {
	templateId: string
}

type MediaNodeData = {
	content: string,
	media_url: string,
	media_type: string
}

type ImageNodeData = MediaNodeData & {
	label: string
}

type VideoNodeData = MediaNodeData

type AudioNodeData = MediaNodeData

type DocumentNodeData = MediaNodeData

type QuestionButtonNodeData = {
	header_type: string,
	header_media_url: string,
	content: string,
	footer_text: string,
	options: {
		id: string,
		title: string
	}[],
	variable_name: string,
	use_fallback: boolean,
	fallback_node_id?: string
}

type ConditionNodeData = {
	conditions: {
		variable_id: string,
		operator: FilterOperator,
		value: string
	}[]
}

type AssignChatNodeData = {
	assign_type: string,
	assign_to_user_id?: string,
	assign_to_bot_id?: string
}

type LocationNodeData = {
	latitude: number,
	longitude: number,
	location_name: string,
	location_address: string
}

type SetVariableNodeData = {
	variables: {
		variable_name: string,
		value: string
	}[]
}

export interface BotNodeDataMap {
	starting_node: StartingNodeData,
	message: MessageNodeData,
	template: TemplateNodeData,
	image: ImageNodeData,
	video: VideoNodeData,
	audio: AudioNodeData,
	document: DocumentNodeData,
	question_button: QuestionButtonNodeData,
	condition: ConditionNodeData,
	start_again: StartAgainNodeData,
	mark_as_solved: MarkAsSolvedNodeData,
	assign_chat: AssignChatNodeData,
	location: LocationNodeData,
	working_hours: WorkingHoursNodeData,
	set_variable: SetVariableNodeData
}