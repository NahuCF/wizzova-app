import { onMounted, onUnmounted } from 'vue'
import { useSessionStore } from '~/stores/session'
import { API } from '~/services'

const HEARTBEAT_INTERVAL_MS = 30 * 1000
const IDLE_TIMEOUT_MS = 10 * 60 * 1000
const THROTTLE_MS = 1000

export function useIdleDetection() {
  const session = useSessionStore()

  let lastActivityTime = Date.now()
  let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null
  let throttleTimeout: ReturnType<typeof setTimeout> | null = null

  const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'pointerdown']

  const isIdle = () => Date.now() - lastActivityTime >= IDLE_TIMEOUT_MS

  const sendHeartbeat = async () => {
    if (!session.user || !session.token) return

    try {
      const { data } = await API.profile.heartbeat(!isIdle())

      if (session.user && session.user.is_available !== data.is_available) {
        session.user.is_available = data.is_available
      }
    } catch {}
  }

  const onActivity = () => {
    if (throttleTimeout) return

    throttleTimeout = setTimeout(() => {
      throttleTimeout = null
    }, THROTTLE_MS)

    lastActivityTime = Date.now()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      lastActivityTime = Date.now()
      sendHeartbeat()
    }
  }

  onMounted(() => {
    activityEvents.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true })
    })

    document.addEventListener('visibilitychange', onVisibilityChange)

    sendHeartbeat()
    heartbeatIntervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
  })

  onUnmounted(() => {
    activityEvents.forEach((event) => {
      window.removeEventListener(event, onActivity)
    })

    document.removeEventListener('visibilitychange', onVisibilityChange)

    if (heartbeatIntervalId) {
      clearInterval(heartbeatIntervalId)
    }

    if (throttleTimeout) {
      clearTimeout(throttleTimeout)
    }
  })
}
