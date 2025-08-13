import Http from '~/config/http'

export default {
  async getAppId() {
    return Http.get<{ app_id: string }>('/meta/app-id')
  },
}
