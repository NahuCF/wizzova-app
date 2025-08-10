import Http from '~/config/http'
import type { UserCreate, UserItem } from '~/types/User'

export default {
  async finishSetup(accessToken: string) {
    return Http.post('/tenant/finish-setup', { access_token: accessToken })
  },
}
