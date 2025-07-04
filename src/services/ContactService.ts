import Http from '~/config/http'
import type { ContactItem, CreateContact, Page } from '~/types'

export default {
    async index(page: number = 1, perPage: number = 10, search: string = '') {
        const params: Record<string, string | number> = {
            page,
            rows_per_page: perPage,
            ...(search && { search }),
        }

        return Http.get<Page<ContactItem>>('/contacts', { params })
    },
    async create(contact: CreateContact) {
        return Http.post<{ data: ContactItem }>('/contacts', contact)
    },
    async update(contact: CreateContact) {
        return Http.put<{ data: ContactItem }>(`/contacts/${contact.id}`, contact)
    },
    async delete(id: string) {
        return Http.delete(`/contacts/${id}`)
    },
    async importContacts(file: File, importType: 'ADD' | 'ADD_AND_REPLACE', mappings: { name: string; id: string }[]) {
        const data = new FormData()
        data.append('file', file)
        data.append('import_type', importType)

        mappings.forEach((mapping, index) => {
            data.append(`mappings[${index}][name]`, mapping.name)
            data.append(`mappings[${index}][id]`, mapping.id)
        })

        return Http.post('/contacts/import', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })
    }
}
