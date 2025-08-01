import { defineStore } from "pinia"
import { ref } from "vue"
import { API } from "~/services"
import type { UserItem } from "~/types/User"

export const useUserStore = defineStore('user', () => {
    const users = ref<UserItem[]>([])
    const deletedUsers = ref<UserItem[]>([])
    const loading = ref(false)
    const loadingDeleted = ref(false)
    const loaded = ref(false)
    const loadedDeleted = ref(false)
    const search = ref<string>()
    const showCreateDialog = ref(false)
    const selectedUser = ref<UserItem>()

    const fetchUsers = async (force = false) => {
        if (loading.value || (loaded.value && !force)) return

        loading.value = true
        try {
            const response = await API.user.index({ 
                ...(search.value && { search: search.value })
            })
            users.value = response.data.data
            loaded.value = true
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            loading.value = false
        }
    }

    const fetchDeletedUsers = async (force = false) => {
        if (loadingDeleted.value || (loadedDeleted.value && !force)) return

        loadingDeleted.value = true
        try {
            const response = await API.user.index({ only_trashed: Number(true) })
            deletedUsers.value = response.data.data
            loadedDeleted.value = true
        } catch (error) {
            console.error('Failed to fetch deleted users:', error)
        } finally {
            loadingDeleted.value = false
        }
    }

    const $reset = () => {
        users.value = []
        loading.value = false
        loaded.value = false

        deletedUsers.value = []
        loadingDeleted.value = false
        loadedDeleted.value = false
        
        search.value = undefined
        showCreateDialog.value = false
        selectedUser.value = undefined
    }

    return {
        users,
        deletedUsers,
        loading,
        loadingDeleted,
        search,
        showCreateDialog,
        selectedUser,
        fetchUsers,
        fetchDeletedUsers,
        $reset
    }
})