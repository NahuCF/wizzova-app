import Http from '~/config/http'

export default {
  index() {
    return Http.get('/industries')
  },
}
