import Http from '~/config/http'
import type { Tenant, BusinessItem } from '~/types'

export default {
	async getBusinesses(accessToken: string) {
		return Http.post<{ data: BusinessItem[] }>('/tenant/meta-access', { access_token: accessToken })
	},
	async completeProfile(businessId: string, wabaId: string) {
		return Http.post<{ data: Tenant }>('/tenant/complete-profile', { 
			business_id: businessId, 
			waba_id: wabaId 
		})
	}
}
