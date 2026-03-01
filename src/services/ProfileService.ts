import Http from '~/config/http'
import type { UserItem } from '~/types'

export default {
  async get() {
    return Http.get<{ data: UserItem }>('/profile')
  },
  async update(payload: Partial<UserItem>) {
    return Http.put<{ data: UserItem }>('/profile', payload)
  },
  async uploadProfileImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return Http.post<{ data: UserItem }>('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  async deleteProfileImage() {
    return Http.delete<{ data: UserItem }>('/profile/image')
  },
}
