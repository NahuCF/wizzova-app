import type { UserItem } from "./User"

export interface CampaignOverview {
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

export type CampaignStatus = 'SCHEDULED' | 'PROCESSING' | 'COMPLETED'

export interface CampaignItem {
    id: string,
    name: string,
    user: UserItem,
    recipients_count: number,
    sent_count: number,
    received_count: number,
    read_count: number,
    failed_count: number,
    status: CampaignStatus,
    created_at: string
}