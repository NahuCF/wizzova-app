import Http from '~/config/http'

export default {
  async index() {
    return Http.get('/templates')
  },
  async store(payload) {
    return Http.post('/templates/create', payload)
  },
}
