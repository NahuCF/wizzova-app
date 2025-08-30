import type { WABAItem } from "./Auth"
import type { ContactItem } from "./Contact"
import type { UserItem } from "./User"

export type ConversationStatus = 'UNASSIGNED' | 'MINE' | 'PINNED' | 'OPENED' | 'SOLVED'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'deleted'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 
	'contacts' | 'sticker' | 'template' | 'interactive' | 'button' | 'reaction' | 'order' | 'system' | 'invoice'

export interface ConversationItem {
	id: string,
	meta_id: string,
	is_solved: boolean,
	is_expired: boolean,
	unread_count: number,
	contact: ContactItem,
	assigned_user?: UserItem,
	waba: WABAItem,
	last_message?: MessageItem,
	last_message_at: string,
	expires_at: string
}

export interface CreateConversation {
	contact_id: string,
	waba_id: string,
	meta_id: string,
	user_id: string,
	is_solved: boolean,
	expires_at: string
}

export interface MessageItem {
	id: string,
	meta_id: string,
	conversation_id: string,
	template_id: string,
	reply_to_message_id?: string,
	type: MessageType,
	direction: MessageDirection,
	status: MessageStatus,
	content?: string,
	media?: string,
	interactive_data?: string,
	location_data?: string,
	contacts_data?: string,
	context?: string,
	errors?: string,
	from_phone: string,
	to_phone: string,
	sent_at?: string,
	delivered_at?: string,
	read_at?: string,
	failed_at?: string,
	created_at: string,
	updated_at: string
}

export interface CreateMessage {
	conversation_id: string,
	meta_message_id?: string,
	direction: MessageDirection,
	type: MessageType,
	status: MessageStatus,
	content: string,
	from_phone: string,
	to_phone: string
}