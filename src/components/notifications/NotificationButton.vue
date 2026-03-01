<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { IconBell, IconBook, IconTrash } from '@tabler/icons-vue'
import { usePopoverPosition } from '~/composables/usePopoverPosition'
import { useNotificationChannel } from '~/composables/pusher/useNotificationChannel'
import { API } from '~/services'
import type { Notification } from '~/services/NotificationService'

interface Props {
  collapsed?: boolean
}

const props = defineProps<Props>()
const popover = ref()
const { positionPopover } = usePopoverPosition(popover)
const notifications = ref<Notification[]>([])
const unreadCount = ref(0)
const lastClickedCount = ref(0)
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const notificationContainer = ref<HTMLElement>()

const newNotificationsSinceClick = computed(() => {
  return Math.max(0, unreadCount.value - lastClickedCount.value)
})

const fetchNotifications = async (loadMore = false) => {
  if (loading.value) return
  
  loading.value = true
  try {
    const currentPage = loadMore ? page.value : 1
    const response = await API.notification.getNotifications(currentPage, 10)
    
    if (loadMore) {
      notifications.value = [...notifications.value, ...response.notifications]
    } else {
      notifications.value = response.notifications
      page.value = 1
    }
    
    unreadCount.value = response.unread_count
    hasMore.value = response.notifications.length === 10
    
    if (loadMore) {
      page.value++
    }
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
  } finally {
    loading.value = false
  }
}

const handleNotificationClick = async (event: Event) => {
  lastClickedCount.value = unreadCount.value
  if (popover.value) {
    popover.value.toggle(event)
  }
  if (unreadCount.value > 0) {
    await markAllAsRead()
  }
}

const markAsRead = async (notification: Notification) => {
  if (!notification.is_read) {
    try {
      await API.notification.markAsRead(notification.id)
      notification.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }
}

const markAllAsRead = async () => {
  try {
    await API.notification.markAllAsRead()
    notifications.value = notifications.value.map(n => ({ ...n, is_read: true }))
    unreadCount.value = 0
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error)
  }
}

const deleteNotification = async (notificationId: string, event: Event) => {
  event.stopPropagation()
  try {
    await API.notification.deleteNotification(notificationId)
    const notification = notifications.value.find(n => n.id === notificationId)
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
    
    if (notification && !notification.is_read) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    console.error('Failed to delete notification:', error)
  }
}

const handleScroll = async (event: Event) => {
  const target = event.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  
  if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore.value && !loading.value) {
    await fetchNotifications(true)
  }
}

const getNotificationIcon = (type: string, icon?: string) => {
  if (icon === 'book') return IconBook
  return IconBell
}

const getTimeAgo = (createdAt: string): string => {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const years = Math.floor(days / 365)

  if (years > 0) {
    const months = Math.floor((days % 365) / 30)
    return `${years}y ${months}m ago`
  } else if (days > 0) {
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h ago`
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return 'just now'
  }
}

useNotificationChannel((notification: Notification) => {
  notifications.value.unshift(notification)
  unreadCount.value++
})

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="p-2">
    <div
      class="flex items-center px-4 py-3 gap-3 rounded-md cursor-pointer hover:bg-slate-100 transition relative"
      @click="handleNotificationClick($event)"
    >
    <div class="relative flex items-center justify-center shrink-0">
      <IconBell size="24" />
      <span 
        v-if="newNotificationsSinceClick > 0"
        class="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pointer-events-none"
      >
        {{ newNotificationsSinceClick > 9 ? '9+' : newNotificationsSinceClick }}
      </span>
    </div>
    <span 
      class="ml-2 truncate transition-opacity duration-300 ease-in-out"
      :class="props.collapsed ? 'opacity-0' : 'opacity-100'"
    >
      {{ $t('notifications.title', 'Notifications') }}
    </span>
  </div>
  </div>

  <Popover
    ref="popover"
    unstyled
    class="bg-white rounded-md shadow-lg border border-gray-200 ml-6 z-50"
    @show="positionPopover({ alignVertical: 'bottom', alignHorizontal: 'right' })"
  >
    <div class="flex flex-col w-[400px] max-h-[60vh] min-h-[200px]">
      <div class="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 class="font-semibold">{{ $t('notifications.title', 'Notifications') }}</h3>
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-sm text-primary hover:underline"
        >
          {{ $t('notifications.mark_all_read', 'Mark all as read') }}
        </button>
      </div>

      <div 
        ref="notificationContainer"
        class="flex-1 overflow-y-auto"
        @scroll="handleScroll"
      >
        <div v-if="loading && notifications.length === 0" class="flex items-center justify-center py-8">
          <ProgressSpinner style="width: 30px; height: 30px" />
        </div>

        <div v-else-if="notifications.length === 0" class="py-8 text-center text-slate-500">
          {{ $t('notifications.empty', 'No notifications yet') }}
        </div>

        <div 
          v-else
          class="divide-y divide-slate-100"
        >
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="flex items-start gap-3 p-4 hover:bg-slate-50 transition group relative"
            :class="{ 'bg-slate-50': !notification.is_read }"
          >
            <component 
              :is="getNotificationIcon(notification.type, notification.icon)"
              class="shrink-0 text-slate-600 mt-1"
              size="20"
            />
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-1">
                <span class="font-medium text-sm">{{ notification.title }}</span>
                <div class="flex items-center gap-2">
                  <button
                    @click="deleteNotification(notification.id, $event)"
                    class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded cursor-pointer"
                    title="Delete notification"
                  >
                    <IconTrash class="w-4 h-4 text-red-500" />
                  </button>
                  <span class="text-xs text-slate-500 shrink-0">{{ getTimeAgo(notification.created_at) }}</span>
                </div>
              </div>
              <p v-if="notification.description" class="text-sm text-slate-600">
                {{ notification.description }}
              </p>
            </div>

            <div 
              v-if="!notification.is_read" 
              class="w-2 h-2 bg-primary rounded-full shrink-0 mt-2"
            />
          </div>
          
          <div v-if="loading && notifications.length > 0" class="flex items-center justify-center py-4">
            <ProgressSpinner style="width: 20px; height: 20px" />
          </div>
        </div>
      </div>
    </div>
  </Popover>
</template>