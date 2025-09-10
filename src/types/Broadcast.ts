import type { ContactGroupItem } from "./Contact"
import type { VariableMapping } from "./Template"
import type { UserItem } from "./User"

type QualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
type CodeVerificationStatus = 'VERIFIED' | 'NOT_VERIFIED'
type WABANumberStatus = 'CONNECTED' | 'PENDING' | 'OFFLINE' | 'UNVERIFIED' | 'FLAGGED' | 'RESTRICTED'

export interface BroadcastOverview {
    recipients_count: {
        count: number,
        percentage: number
    },
    sent_count: {
        count: number,
        percentage: number
    },
    delivered_count: {
        count: number,
        percentage: number
    },
    readed_count: {
        count: number,
        percentage: number
    },
    replied_count: {
        count: number,
        percentage: number
    },
    failed_count: {
        count: number,
        percentage: number
    }
}

export interface WABANumber {
    id: string,
    display_phone_number: string,
    verified_name: string,
    quality_rating: QualityRating,
    code_verification_status: CodeVerificationStatus,
    is_verified: boolean,
    is_registed: boolean,
    status: WABANumberStatus,
    can_send_messages: boolean
}

export type BroadcastStatus = 'queued' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'completed'

export interface BroadcastItem {
    id: string,
    name: string,
    user: UserItem,
    recipients_count?: number,
    sent_count?: number,
    delivered_count?: number,
    readed_count?: number,
    failed_count?: number,
    status?: BroadcastStatus,
    send_at: string | null,
    scheduled_at?: string,
    template_id?: string,
    created_at: string,
}

export interface BroadcastDetail extends BroadcastItem {
    replied_count?: number,
    groups: ContactGroupItem[],
    phone_number: WABANumber
}

export interface BroadcastFilters {
    phone_number_id: string,
    page?: number,
    rows_per_page?: number,
    search?: string,
    start_date?: string,
    end_date?: string,
    status?: BroadcastStatus
}

export interface BroadcastOverviewFilters { 
    phone_number_id: string,
    overview_days: number
}

export interface BroadcastCreate {
    name: string,
    scheduled_at?: string,
    follow_whatsapp_business_policy?: boolean,
    template_id: string,
    group_ids: string[],
    phone_number_id: string,
    variables?: VariableMapping[],
    send_now: boolean,
    send_to_all_numbers: boolean
}

export type BroadcastRepeat = { send_now: boolean } | { scheduled_at: string }