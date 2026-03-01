import type { BotStatus } from './Bot'
import type { FilterOperator } from './Common'
import type { PaginationMeta, Page } from './Pagination'
import type { UserItem } from './User'

export type BotVersionItem = {
  id: string
  bot_id: string
  name: string
  total_sessions: number
  completed_sessions: number
  abandoned_sessions: number
  active_sessions_count: number
  nodes_count: number
  edges_count: number
  status: BotStatus
  created_by?: UserItem
  updated_by?: UserItem
  created_at: string
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

export type BotFilterOperator =
  | 'equal'
  | 'not_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'contains'

export type BotNode = {
  id: string
  position: {
    x: number
    y: number
  }
} & {
  [K in keyof BotNodeDataMap]: {
    type: K
    data: BotNodeDataMap[K]
  }
}[keyof BotNodeDataMap]

export type BotEdge = {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  data?: {
    option_id?: string
    condition_path?: string
    is_default?: boolean
    working_hours_path?: 'Available' | 'Unavailable'
  }
}

export type BotViewport = {
  x: number
  y: number
  zoom: number
}

export type CreateBotVersion = {
  id: string
  name: string
  nodes: BotNode[]
  edges: BotEdge[]
  viewport?: BotViewport
}

export type BotVersionData = {
  id: string
  name: string
  status: BotStatus
  nodes: BotNode[]
  edges: BotEdge[]
  viewport?: BotViewport
  created_by?: UserItem
  updated_by?: UserItem
  created_at: string
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

export type TemplateNodeData = {
  template_id: string
  template_parameters: Record<string, string>
}

export type MediaNodeType = 'image' | 'video' | 'audio' | 'document'

export type MediaNodeData = {
  content: string
  media_url: string
  media_type: MediaNodeType
}

export type MediaFile = {
  url: string
  path: string
  media_type: string
  size: number
  filename: string
}

type ImageNodeData = MediaNodeData & {
  label: string
  media_type: 'image'
}

type VideoNodeData = MediaNodeData & {
  media_type: 'video'
}

type AudioNodeData = MediaNodeData & {
  media_type: 'audio'
}

type DocumentNodeData = MediaNodeData & {
  media_type: 'document'
}

export type BotNodeHeaderType = 'text' | 'image' | 'video' | 'document'

type QuestionButtonNodeData = {
  header_type?: BotNodeHeaderType
  header_text?: string
  header_media_url?: string
  content?: string
  footer_text?: string
  options: {
    id: string
    title: string
  }[]
  variable_name: string
  use_fallback: boolean
  fallback_node_id?: string
}

export type ConditionNodeData = {
  conditions: {
    variable_id: string
    operator?: BotFilterOperator
    value: string
  }[]
}

type AssignChatNodeData = {
  assign_type: 'user' | 'bot'
  assign_to_user_id?: string
  assign_to_bot_id?: string
}

type LocationNodeData = {
  latitude: number
  longitude: number
  name: string
  address: string
}

type SetVariableNodeData = {
  variables: {
    variable_name: string
    value: string
  }[]
}

export interface BotNodeDataMap {
  starting_node: StartingNodeData
  message: MessageNodeData
  template: TemplateNodeData
  image: ImageNodeData
  video: VideoNodeData
  audio: AudioNodeData
  document: DocumentNodeData
  question_button: QuestionButtonNodeData
  condition: ConditionNodeData
  start_again: StartAgainNodeData
  mark_as_solved: MarkAsSolvedNodeData
  assign_chat: AssignChatNodeData
  location: LocationNodeData
  working_hours: WorkingHoursNodeData
  set_variable: SetVariableNodeData
}
