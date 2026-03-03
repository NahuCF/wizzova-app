import { onMounted, onBeforeUnmount } from 'vue'
import { usePusher } from './usePusher'
import { useSessionStore } from '~/stores'
import type { Channel } from 'pusher-js'
import type { Notification } from '~/services/NotificationService'

export const useNotificationChannel = (
  onNewNotification?: (notification: Notification) => void,
) => {
  const sessionStore = useSessionStore()
  const { subscribe, unsubscribe } = usePusher()
  let channel: Channel | null = null

  const handleNewNotification = (notification: Notification) => {
    if (onNewNotification) {
      onNewNotification(notification)
    }
  }

  onMounted(() => {
    if (!sessionStore.tenant || !sessionStore.user) return

    const channelName = `private-tenant.${sessionStore.tenant.id}.notifications.${sessionStore.user.id}`
    channel = subscribe(channelName)

    channel.bind('notification.new', handleNewNotification)
  })

  onBeforeUnmount(() => {
    if (channel) {
      channel.unbind('notification.new', handleNewNotification)
      unsubscribe(channel.name)
    }
  })

  return {
    channel,
  }
}
