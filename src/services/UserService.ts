import Http from '~/config/http'
import type { UserCreate, UserItem } from '~/types/User'

export default {
  index(filters?: { only_trashed?: number; search?: string }) {
    return Http.get<{ data: UserItem[] }>('/users', {
      params: filters,
    })
  },
  async create(user: UserCreate) {
    return Http.post<{ data: UserItem }>('/users', user)
  },
  async update(user: UserCreate) {
    return Http.put<{ data: UserItem }>(`/users/${user.id}`, user)
  },
  async uploadImage(userId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return Http.post(`/users/${userId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  async delete(id: string) {
    return Http.delete(`/users/${id}`)
  },
  async restore(id: string) {
    return Http.post(`/users/${id}/restore`)
  },
}
