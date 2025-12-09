export type PlanType = 'growth' | 'scale' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'
export type PaymentProvider = 'stripe' | 'mercadopago'
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'grace_period' | 'suspended'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'mercadopago_approved' | 'mercadopago_pending' | 'mercadopago_in_process' | 'mercadopago_in_mediation' | 'mercadopago_rejected' | 'mercadopago_cancelled' | 'mercadopago_authorized' | 'mercadopago_refunded' | 'mercadopago_partially_refunded' | 'mercadopago_charged_back' | 'stripe_succeeded' | 'stripe_pending' | 'stripe_failed' | 'stripe_cancelled' | 'stripe_processing' | 'stripe_requires_action'

export interface Subscription {
    id: string
    tenant_id?: string
    plan_type: PlanType
    billing_cycle: BillingCycle
    payment_provider?: PaymentProvider
    status: SubscriptionStatus
    provider_subscription_id?: string
    is_active: boolean
    is_in_grace_period: boolean
    limits: {
        max_users?: number
        used_users: number
        remaining_users: number
        extra_users_purchased: number
        max_contacts?: number
        used_contacts: number
        remaining_contacts: number
        max_whatsapp_numbers?: number
        used_whatsapp_numbers: number
        remaining_whatsapp_numbers: number
    }
    pricing: {
        amount: number
        currency: string
        monthly_price: number
        yearly_price: number
    }
    dates: {
        start_date: string
        end_date: string
        cancelled_at?: string
        grace_period_ends_at?: string
        created_at: string
        updated_at: string
    }
    features: string[]
    payments?: any[]
    metadata?: Record<string, any>
}

export interface Payment {
    id: string
    subscription_id: string
    payment_provider: PaymentProvider
    provider_payment_id?: string
    status: PaymentStatus
    amount: number
    currency: string
    description?: string
    paid_at?: string
    invoice_url?: string
    provider_response?: Record<string, any>
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
}

export interface CreateSubscriptionRequest {
    plan_type: string
    billing_cycle: string
    extra_users?: number
}

export interface MercadoPagoLinkResponse {
    link: string
}

export interface SubscriptionResponse {
    success: boolean
    data: Subscription | null
}

export interface PaymentHistoryResponse {
    success: boolean
    data: Payment[]
    meta?: {
        current_page: number
        per_page: number
        total: number
        last_page: number
    }
}