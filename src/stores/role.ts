import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '~/services'
import type { PermissionList, RoleItem } from '~/types'

export const useRoleStore = defineStore('role', () => {
  const roles = ref<RoleItem[]>([])
  const permissions = ref<PermissionList>()
  const loading = ref(false)
  const loaded = ref(false)
  const loadingPermissions = ref(false)
  const loadedPermissions = ref(false)
  const showCreateDialog = ref(false)
  const selectedRole = ref<RoleItem>()

  const fetchRoles = async (force = false) => {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    try {
      const response = await API.role.index()
      roles.value = response.data.data
      loaded.value = true
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchPermissions = async (force = false) => {
    if (loadingPermissions.value || (loadedPermissions.value && !force)) return

    loadingPermissions.value = true
    try {
      const response = await API.role.permissions()
      permissions.value = response.data
      loadedPermissions.value = true
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    } finally {
      loadingPermissions.value = false
    }
  }

  const $reset = () => {
    roles.value = []
    loading.value = false
    loaded.value = false

    permissions.value = undefined
    loadingPermissions.value = false
    loadedPermissions.value = false

    showCreateDialog.value = false
    selectedRole.value = undefined
  }

  return {
    roles,
    permissions,
    loading,
    loadingPermissions,
    showCreateDialog,
    selectedRole,
    fetchRoles,
    fetchPermissions,
    $reset,
  }
})
