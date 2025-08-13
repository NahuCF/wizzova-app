import Http from '~/config/http'
import type { Tenant, WABAItem } from '~/types'

export default {
	async getWABAs(accessToken: string) {
		return Http.post<{ data: WABAItem[] }>('/tenant/meta-access', { access_token: accessToken })
	},
	async completeProfile(businessId: string) {
		return Http.post<{ data: Tenant }>('/tenant/complete-profile', { business_id: businessId })
	}
}
