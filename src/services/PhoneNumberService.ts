import Http from '~/config/http'
import type { WABANumber } from '~/types'

export default {
  async index(wabaId: string) {
    return Http.get<{ data: WABANumber[] }>('/phone-numbers', {
      params: { waba_id: wabaId },
    })
  },

  async showProfile(id: string) {
    return Http.get<{ data: WABANumber }>(`/phone-numbers/${id}/profile`)
  },

  async updateProfile(id: string, data: Partial<WABANumber>) {
    return Http.put<{ data: WABANumber }>(`/phone-numbers/${id}/profile`, data)
  },

  async uploadProfilePicture(id: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)

    return Http.post<{ data: WABANumber }>(`/phone-numbers/${id}/profile/picture`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async verticals() {
    return Http.get<{ data: string[] }>('/phone-numbers/verticals')
  },

  async available(wabaId: string) {
    return Http.get<{ data: Array<{ id: string; display_phone_number: string; verified_name: string }> }>(
      '/phone-numbers/available',
      { params: { waba_id: wabaId } },
    )
  },

  async connect(wabaId: string, metaPhoneId: string) {
    return Http.post<{ data: WABANumber }>('/phone-numbers/connect', {
      waba_id: wabaId,
      meta_phone_id: metaPhoneId,
    })
  },
}
