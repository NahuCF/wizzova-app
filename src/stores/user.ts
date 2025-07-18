import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { API } from "~/services"
import type { UserItem } from "~/types/User"

export const useUserStore = defineStore('user', () => {
    const users = ref<UserItem[]>([])
    const loading = ref(false)

    const fetchUsers = async () => {
        if (loading.value) return

        loading.value = true
        try {
            const response = await API.user.index()
            users.value = response.data.data
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        users,
        loading,
        fetchUsers
    }
})