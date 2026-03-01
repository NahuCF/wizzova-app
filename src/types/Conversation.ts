import type { WABAItem } from './Auth'
import type { WABANumber } from './Broadcast'
import type { ContactItem } from './Contact'
import type { VariableMapping } from './Template'
import type { UserItem } from './User'

export type ConversationStatus = 'unassigned' | 'mine' | 'pinned' | 'opened' | 'resolved'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'template'
  | 'interactive'
  | 'button'
  | 'reaction'
  | 'order'
  | 'system'
  | 'invoice'
  | 'note'

export interface ConversationItem {
  id: string
  meta_id: string
  is_solved: boolean
  is_expired: boolean
  is_initiated: boolean
  unread_count: number
  contact: ContactItem
  assigned_user?: UserItem
  waba: WABAItem
  phone_number: WABANumber
  last_message?: MessageItem
  last_message_at: string
  started_at?: string
  expires_at: string
  is_pinned?: boolean
  matching_message?: {
    message_content: string
    message_id: string
    page: number
    position_from_end: number
  }
}

export interface ConversationExists {
  message: string
  message_code: string
  data: {
    conversation_id: string
    assigned_user_name?: string
  }
}

export interface CreateConversation {
  contact_id: string
  waba_id: string
  phone_number_id: string
  to_phone: string
}

export interface MessageItem {
  id: string
  meta_id: string
  conversation_id: string
  template_id: string
  reply_to_message?: MessageItem
  type: MessageType
  direction: MessageDirection
  status: MessageStatus
  content?: string
  media?: string
  interactive_data?: string
  location_data?: string
  contacts_data?: string
  context?: string
  errors?: string
  from_phone: string
  to_phone: string
  sent_at?: string
  delivered_at?: string
  read_at?: string
  failed_at?: string
  deleted_at?: string
  created_at: string
  updated_at: string
  mentions?: Record<string, string>[]
  search_match?: {
    page: number
    position_from_end: number
  }
}

export interface CreateMessage {
  conversation_id: string
  template_id?: string
  variables?: VariableMapping[]
  reply_to_message_id?: string
  type: MessageType
  content?: string
  media?: string
  to_phone: string
  mentions?: Record<string, string>[]
}

export interface MessageDelivered {
  message_id: string
  conversation_id: string
  status: MessageStatus
}

export interface MessageDeleted {
  message_id: string
  conversation_id: string
  deleted_at: string
  delete_by?: {
    type: string
    phone: string | null
  }
}

export type MentionItem = { id: string; label: string }

export interface ConversationStats {
  unassigned: number
  mine: number
  opened: number
  resolved: number
  pinned: number
}

export interface ConversationFilters {
  status?: 'opened' | 'resolved'
  unread?: boolean
  assignedUser?: UserItem
}

export type ConversationActivityType =
  | 'assigned'
  | 'unassigned'
  | 'resolved'
  | 'reopened'
  | 'conversation_started'
  | 'conversation_expired'

export interface BaseConversationActivity {
  id: string
  conversation_id: string
  event_at: string
}

interface ConversationActivityDataMap {
  assigned: {
    old_user_name: string | null
    new_user_name: string
  }
  unassigned: {
    old_user_name: string
    new_user_name: null
  }
  resolved: {
    user_name: string
  }
  reopened: {
    user_name: string
  }
  conversation_started: {
    user_name: string
  }
  conversation_expired: {}
}

export type ConversationActivity = {
  [K in keyof ConversationActivityDataMap]: BaseConversationActivity & {
    type: K
    data: ConversationActivityDataMap[K]
  }
}[keyof ConversationActivityDataMap]
