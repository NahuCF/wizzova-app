import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserPreferencesStore = defineStore(
  'userPreferences',
  () => {
    const sidebarCollapsed = ref(false)

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const setSidebarCollapsed = (v: boolean) => {
      sidebarCollapsed.value = v
    }

    const $reset = () => {
      sidebarCollapsed.value = false
    }

    return {
      sidebarCollapsed,
      toggleSidebar,
      setSidebarCollapsed,
      $reset,
    }
  },
  {
    persist: [
      {
        pick: ['sidebarCollapsed'],
      },
    ],
  },
)
