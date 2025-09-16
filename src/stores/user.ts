import { defineStore } from "pinia"
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { API } from "~/services"
import type { UserItem } from "~/types/User"

export const useUserStore = defineStore('user', () => {
    const { t } = useI18n()

    const users = ref<UserItem[]>([])
    const deletedUsers = ref<UserItem[]>([])
    const loading = ref(false)
    const loadingDeleted = ref(false)
    const loaded = ref(false)
    const loadedDeleted = ref(false)
    const search = ref<string>()
    const showCreateDialog = ref(false)
    const selectedUser = ref<UserItem>()
    const notAssigned: UserItem = {
        id: 'not_assigned',
        email: '',
        name: t('conversations.not_assigned'),
        cellphone_number: '',
        cellphone_prefix: '',
        cellphone: '',
        role: {
            id: 0,
            name: '',
            is_internal: false
        },
        wabas: [],
        permission_names: [],
        is_deleted: false,
        status: 'SIGNED_UP'
    }

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
        notAssigned,
        fetchUsers,
        fetchDeletedUsers,
        $reset
    }
})