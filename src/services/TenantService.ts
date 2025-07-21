import Http from '~/config/http'

export default {
  async storeLongLovedToken(token: string = '') {
    return Http.post<{ data: any }>('/tenant/long-lived-token', {
      token,
    })
  },
}
