import Http from '~/config/http'

export default {
  async index() {
    return Http.get('/templates/languages')
  },
}
