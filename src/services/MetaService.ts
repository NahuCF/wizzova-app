import Http from '~/config/http'

export default {
  async getAppId() {
    return Http.get<{ data: any }>('/meta/app-id')
  },
}
