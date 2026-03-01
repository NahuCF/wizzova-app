import Http from '~/config/http'
import type { ContactFieldCreate, ContactFieldItem, ContactFieldType, Page } from '~/types'

export default {
  async index(page: number = 1, perPage: number = 12, is_primary_field: boolean = false) {
    const params: Record<string, string | number | boolean> = {
      page,
      rows_per_page: perPage,
      is_primary_field: Number(is_primary_field),
    }

    return Http.get<Page<ContactFieldItem>>('/contacts/fields', { params })
  },
  async types() {
    return Http.get<{ data: ContactFieldType[] }>('/contacts/fields/types')
  },
  async create(contactField: ContactFieldCreate) {
    return Http.post<{ data: ContactFieldItem }>('/contacts/fields', contactField)
  },
  async update(contactField: ContactFieldCreate) {
    return Http.put<{ data: ContactFieldItem }>(`/contacts/fields/${contactField.id}`, contactField)
  },
  async changeStatus(id: number, value: boolean) {
    return Http.put<{ data: ContactFieldItem }>(`/contacts/fields/${id}/change-status`, {
      is_active: value,
    })
  },
  async changeMandatory(id: number, value: boolean) {
    return Http.put<{ data: ContactFieldItem }>(`/contacts/fields/${id}/change-mandatory`, {
      is_mandatory: value,
    })
  },
  async delete(id: string) {
    return Http.delete(`/contacts/fields/${id}`)
  },
}
