import Http from '~/config/http'
import type { ContactFieldItem, ContactItem, Page } from '~/types'

export default {
    async index(page: number = 1, perPage: number = 10, search: string = '') {
        const params: Record<string, string | number> = {
            page,
            rows_per_page: perPage,
            ...(search && { search }),
        }

        return Http.get<Page<ContactItem>>('/contacts', { params })
    },
    async delete(id: string) {
        return Http.delete(`/contacts/${id}`)
    }
}
