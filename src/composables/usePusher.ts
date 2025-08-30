import { ref, onUnmounted } from 'vue'
import Pusher, { Channel } from 'pusher-js'

type ChannelsMap = Record<string, Channel>

export const usePusher = () => {
    const pusher = ref<Pusher | null>(null)
    const channels = ref<ChannelsMap>({})

    const connect = () => {
        if (!pusher.value) {
            pusher.value = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
                wsHost: import.meta.env.VITE_PUSHER_HOST,
                wsPort: import.meta.env.VITE_PUSHER_PORT,
                wssPort: import.meta.env.VITE_PUSHER_PORT,
                forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
                enabledTransports: ['ws', 'wss'],
                disableStats: true,
                cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            })
        }
    }

    const subscribe = (channelName: string) => {
        connect()
        if (!channels.value[channelName]) {
            channels.value[channelName] = pusher.value!.subscribe(channelName)
        }
        return channels.value[channelName]
    }

    const unsubscribe = (channelName: string) => {
        if (channels.value[channelName]) {
            pusher.value?.unsubscribe(channelName)
            delete channels.value[channelName]
        }
    }

    onUnmounted(() => {
        if (pusher.value) {
            Object.keys(channels.value).forEach(channelName => {
                pusher.value!.unsubscribe(channelName)
            })
            pusher.value.disconnect()
            pusher.value = null
        }
    })

    return { subscribe, unsubscribe, pusher }
}