import Http from '~/config/http'

export interface Notification {
  id: string
  type: string
  icon?: string
  title: string
  description?: string
  data?: Record<string, any>
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface NotificationResponse {
  notifications: Notification[]
  unread_count: number
}

class NotificationService {
  async getNotifications(page: number = 1, perPage: number = 10): Promise<NotificationResponse> {
    const { data } = await Http.get<NotificationResponse>('/notifications', {
      params: { page, per_page: perPage }
    })
    return data
  }

  async markAsRead(notificationId: string): Promise<void> {
    await Http.post(`/notifications/${notificationId}/mark-read`)
  }

  async markAllAsRead(): Promise<void> {
    await Http.post('/notifications/mark-all-read')
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await Http.delete(`/notifications/${notificationId}`)
  }
}

export default new NotificationService()