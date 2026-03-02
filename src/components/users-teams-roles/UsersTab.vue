<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { useCrudActions } from '~/composables/useCrudActions'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useUserStore, useSessionStore, useTeamStore } from '~/stores'
import { userStatusSeverity } from '~/types'
import type { Column, UserCreate, UserItem } from '~/types'

const { hasPermission, isOwner } = useSessionStore()
const userStore = useUserStore()
const { fetchUsers, fetchDeletedUsers } = userStore
const { fetchTeams } = useTeamStore()
const { loading, users, showCreateDialog, selectedUser } = storeToRefs(userStore)

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const { loading: loadingDelete, remove } = useCrudActions<UserCreate>({
  api: { delete: API.user.delete },
  fetchData: () => {
    fetchUsers(true)
    fetchTeams(true)
  },
  i18nKeys: { deleted: 'users.user_deleted' },
})

const loadingSave = ref(false)
const showDeleteDialog = ref(false)

const userActions = (user: UserItem) => {
  const editUser = {
    label: t('users.edit'),
    icon: IconEdit,
    action: () => {
      selectedUser.value = user
      showCreateDialog.value = true
    },
  }
  const deleteUser = {
    label: t('delete'),
    class: 'text-red-600',
    icon: IconTrash,
    action: () => {
      selectedUser.value = user
      showDeleteDialog.value = true
    },
  }

  if (user.role.is_internal && user.role.name === 'Owner' && !isOwner) {
    return []
  }

  if (user.role.is_internal && user.role.name === 'Owner') {
    return [[editUser]]
  }

  return [[editUser], [deleteUser]]
}

const columns = computed(() => {
  let columnList: Column[] = [
    { header: '', key: 'avatar', type: 'CUSTOM', bodyStyle: { width: '50px' } },
    { header: t('users.headers.name'), key: 'name' },
    { header: t('users.headers.email'), key: 'email' },
    { header: t('users.headers.role'), key: 'roleName' },
    { header: t('users.headers.status'), key: 'statusTag', type: 'TAG' },
  ]

  if (hasPermission('settings.manage_user_roles_and_teams')) {
    columnList = [...columnList, { header: '', key: 'actions', type: 'ACTIONS' }]
  }

  return columnList
})

const transformedData = computed(() => {
  return users.value.map((user) => ({
    ...user,
    roleName: user.role.name,
    statusTag: {
      label: t(`users.status.${user.status}`),
      severity: userStatusSeverity[user.status],
    },
    actions: userActions,
  }))
})

const onSave = async (user: UserCreate, file?: File) => {
  loadingSave.value = true
  try {
    let response
    if (user.id) {
      response = await API.user.update(user)
    } else {
      response = await API.user.create(user)
    }

    if (file) {
      await API.user.uploadImage(response.data.data.id, file)
    }

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: t(user.id ? 'users.user_updated' : 'users.user_created'),
      life: 3000,
    })
    fetchUsers(true)
    fetchTeams(true)
    showCreateDialog.value = false
  } catch (error) {
    handleError(error)
  } finally {
    loadingSave.value = false
  }
}

const onDelete = () => {
  if (selectedUser.value?.id) {
    remove(selectedUser.value.id, {
      onSuccess: () => {
        showDeleteDialog.value = false
        fetchDeletedUsers(true)
      },
    })
  }
}

fetchUsers()
</script>

<template>
  <div class="flex flex-col h-full">
    <Table
      :data="transformedData"
      :columns="columns"
      emptyMessage="users.empty"
      :loading="loading"
    >
      <template #avatar="{ data }">
        <Avatar v-if="data.profile_img_path" :image="data.profile_img_path" shape="circle" />
        <Avatar v-else :label="data.name?.charAt(0)?.toUpperCase()" shape="circle" />
      </template>
    </Table>

    <UserDrawer
      v-model:visible="showCreateDialog"
      :title="selectedUser ? $t('users.edit_user') : $t('users.create_user')"
      :loading="loadingSave"
      :userEdited="selectedUser"
      @onSave="onSave"
    />
    <WarningDialog
      v-model:visible="showDeleteDialog"
      :title="$t('users.delete_user')"
      :message="$t('users.delete_message')"
      @onConfirm="onDelete"
    />
  </div>
</template>
