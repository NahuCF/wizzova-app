import Http from '~/config/http'
import type {
  ContactImportItem,
  ContactImportMode,
  ContactItem,
  CreateContact,
  Page,
} from '~/types'

export default {
  async storeLongLovedToken(token: string = '') {
    return Http.post<{ data: ContactItem }>('/tenants/long-lived-token', {
      token,
    })
  },
}
