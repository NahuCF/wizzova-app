import Http from '~/config/http'

export default {
  async headerTypes() {
    return Http.get('/templates/header-types')
  },
}
