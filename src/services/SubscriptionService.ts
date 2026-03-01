import Http from '~/config/http'
import type { CreateSubscriptionRequest, MercadoPagoLinkResponse, Subscription } from '~/types'

export default {
  generateMercadoPagoLink(data: CreateSubscriptionRequest) {
    return Http.post<{ data: MercadoPagoLinkResponse }>(
      '/subscription/mercadopago/subscription-link',
      data,
    )
  },

  getCurrentSubscription() {
    return Http.get<{ data: Subscription | null }>('/subscription/current')
  },

  getSubscriptions(params?: { rows_per_page?: number; status?: string }) {
    return Http.get<{ data: Subscription[] }>('/subscription', { params })
  },

  getPaymentHistory(params?: { rows_per_page?: number; status?: string }) {
    return Http.get<{ data: any[] }>('/subscription/payment-history', { params })
  },

  createSubscriptionLink(data: CreateSubscriptionRequest) {
    return Http.post<{ data: MercadoPagoLinkResponse }>(
      '/subscription/mercadopago/subscription-link',
      data,
    )
  },

  cancelSubscription() {
    return Http.post<{ data: Subscription }>('/subscription/cancel')
  },

  purchaseExtraUsers(quantity: number) {
    return Http.post<{ data: any }>('/subscription/purchase-extra-users', {
      quantity,
    })
  },

  removeExtraUsers(quantity: number) {
    return Http.post<{ data: any }>('/subscription/remove-extra-users', {
      quantity,
    })
  },
}
