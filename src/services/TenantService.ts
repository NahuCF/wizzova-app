import Http from '~/config/http'
import type { BusinessItem, Tenant, WABANumber } from '~/types'

export default {
	async getBusinesses(accessToken: string) {
		return Http.post<{ data: BusinessItem[] }>('/tenant/meta-access', { access_token: accessToken })
	},
	async storeDefaultWABA(businessId: string, wabaId: string) {
		return Http.post<{ data: WABANumber[] }>('/tenant/store-default-waba', { 
			business_id: businessId, 
			waba_id: wabaId 
		})
	},
	async selectWABANumber(phoneId: string) {
		return Http.post<{ data: WABANumber, meta: { tenant: Tenant } }>('/tenant/select-number', { 
			phone_id: phoneId
		})
	},
	async registerWABANumber(businessName: string, phoneNumber: string, countryPrefix: string) {
		return Http.post<{ data: WABANumber, meta: { tenant: Tenant } }>('/tenant/select-number', { 
			verified_name: businessName,
			display_phone_number: phoneNumber,
			cc: countryPrefix
		})
	},
	async verifyNumberCode(phoneId: string, code: string) {
		return Http.post<{ data: WABANumber, meta: { tenant: Tenant } }>('/tenant/verify-number-code', { 
			code: code,
			phone_id: phoneId
		})
	}
}
