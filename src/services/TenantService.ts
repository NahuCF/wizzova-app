import Http from '~/config/http'

export default {
  async finishSetup(accessToken: string) {
    return Http.post('/tenant/finish-setup', { access_token: accessToken })
  },
}
