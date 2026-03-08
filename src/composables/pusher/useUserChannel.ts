import { onMounted, onBeforeUnmount } from 'vue'
import { usePusher } from './usePusher'
import { useSessionStore } from '~/stores'
import type { Channel } from 'pusher-js'

interface UserAvailabilityPayload {
  user_id: string
  is_available: boolean
}

export const useUserChannel = (
  onAvailabilityChanged?: (payload: UserAvailabilityPayload) => void,
) => {
  const sessionStore = useSessionStore()
  const { subscribe, unsubscribe } = usePusher()
  let channel: Channel | null = null

  const handleAvailabilityChanged = (payload: UserAvailabilityPayload) => {
    if (onAvailabilityChanged) {
      onAvailabilityChanged(payload)
    }
  }

  onMounted(() => {
    if (!sessionStore.tenant) return

    const channelName = `private-tenant.${sessionStore.tenant.id}.users`
    channel = subscribe(channelName)

    channel.bind('user.availability.changed', handleAvailabilityChanged)
  })

  onBeforeUnmount(() => {
    if (channel) {
      channel.unbind('user.availability.changed', handleAvailabilityChanged)
      unsubscribe(channel.name)
    }
  })

  return {
    channel,
  }
}
