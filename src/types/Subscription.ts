export type PlanType = 'growth' | 'scale' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'
export type PaymentProvider = 'stripe' | 'mercadopago'
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired' | 'grace_period' | 'suspended'

export interface Subscription {
    id: string
    tenant_id: string
    plan_type: PlanType
    billing_cycle: BillingCycle
    payment_provider: PaymentProvider
    status: SubscriptionStatus
    provider_subscription_id?: string
    max_users?: number
    used_users: number
    max_contacts?: number
    used_contacts: number
    max_whatsapp_numbers?: number
    used_whatsapp_numbers: number
    extra_users_purchased: number
    start_date: string
    end_date: string
    cancelled_at?: string
    grace_period_ends_at?: string
    amount: number
    currency: string
    metadata?: Record<string, any>
    created_at: string
    updated_at: string
}

export interface CreateSubscriptionRequest {
    plan_type: PlanType
    billing_cycle: BillingCycle
    extra_users?: number
}

export interface MercadoPagoLinkResponse {
    link: string
}