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

export type BroadcastStatus = 'queued' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'

export interface BroadcastItem {
    id: string,
    name: string,
    user: UserItem,
    recipients_count?: number,
    sent_count?: number,
    received_count?: number,
    read_count?: number,
    failed_count?: number,
    status?: BroadcastStatus,
    send_at: string | null,
    created_at: string
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
    variables?: VariableMapping[]
}