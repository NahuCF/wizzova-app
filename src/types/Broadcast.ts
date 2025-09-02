import type { UserItem } from "./User"

type QualityRating = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
type CodeVerificationStatus = 'VERIFIED' | 'NOT_VERIFIED'
type WABANumberStatus = 'CONNECTED' | 'PENDING' | 'OFFLINE' | 'UNVERIFIED' | 'FLAGGED' | 'RESTRICTED'

export interface BroadcastOverview {
    recipients: number,
    sent: {
        count: number,
        percentage: number
    },
    received: {
        count: number,
        percentage: number
    },
    read: {
        count: number,
        percentage: number
    },
    responded: {
        count: number,
        percentage: number
    },
    failed: {
        count: number,
        percentage: number
    }
}

export interface BroadcastNumber {
    id: string,
    number: string,
    name: string
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

export type BroadcastStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED'

export interface BroadcastItem {
    id: string,
    name: string,
    user: UserItem,
    recipients_count: number,
    sent_count: number,
    received_count: number,
    read_count: number,
    failed_count: number,
    status: BroadcastStatus,
    created_at: string
}