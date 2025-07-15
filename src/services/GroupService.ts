import Http from '~/config/http'
import type { ContactGroupItem, CreateContactGroup, Page } from '~/types'

export default {
    async index(
        page: number = 1,
        perPage: number = 10,
        search: string = ''
    ) {
        const params: Record<string, number | string> = {
            page,
            rows_per_page: perPage,
            ...(search && { search })
        }

        return Http.get<Page<ContactGroupItem>>('/groups', { params })
    },
    async create(group: CreateContactGroup) {
        return Http.post<{ data: ContactGroupItem }>('/groups', group)
    },
    async update(group: CreateContactGroup) {
        return Http.put<{ data: ContactGroupItem }>(`/groups/${group.id}`, group)
    },
    async delete(id: string) {
        return Http.delete(`/groups/${id}`)
    }
}
