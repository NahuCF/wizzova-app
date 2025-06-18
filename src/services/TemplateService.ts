import Http from '~/config/http'
import type { TemplateCreate } from '~/types'

export default {
  async index() {
    return Http.get('/templates')
  },
  async store(payload: TemplateCreate) {
    return Http.post('/templates/create', payload)
  },
}
