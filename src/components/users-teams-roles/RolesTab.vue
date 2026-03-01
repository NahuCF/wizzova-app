<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import { useRoleStore } from '~/stores/role'
import type { Column } from '~/types'
import type { RoleCreate, RoleItem } from '~/types/User'

const { hasPermission } = useSessionStore()
const roleStore = useRoleStore()
const { fetchRoles } = roleStore
const { loading, roles, selectedRole, showCreateDialog } = storeToRefs(roleStore)

const { t } = useI18n()

const {
  loading: loadingDrawer,
  createOrUpdate,
  remove,
} = useCrudActions<RoleCreate>({
  api: {
    create: API.role.create,
    update: API.role.update,
    delete: API.role.delete,
  },
  fetchData: () => fetchRoles(true),
  i18nKeys: {
    created: 'roles.role_created',
    updated: 'roles.role_updated',
    deleted: 'roles.role_deleted',
  },
})

const showDeleteDialog = ref(false)
const roleActions = (role: RoleItem) => {
  if (role.is_internal) {
    return []
  }

  return [
    [
      {
        label: t('roles.edit'),
        icon: IconEdit,
        action: () => {
          selectedRole.value = role
          showCreateDialog.value = true
        },
      },
    ],
    [
      {
        label: t('delete'),
        class: 'text-red-600',
        icon: IconTrash,
        action: () => {
          selectedRole.value = role
          showDeleteDialog.value = true
        },
      },
    ],
  ]
}

const columns = computed(() => {
  let columnList: Column[] = [
    { header: t('roles.headers.name'), key: 'name' },
    { header: t('roles.headers.created_by'), key: 'createdBy' },
  ]

  if (hasPermission('settings.manage_user_roles_and_teams')) {
    columnList = [...columnList, { header: '', key: 'actions', type: 'ACTIONS' }]
  }

  return columnList
})

const transformedData = computed(() => {
  return roles.value.map((role) => ({
    ...role,
    createdBy: role.user?.name || t('roles.system'),
    actions: roleActions,
  }))
})

const onSave = (role: RoleCreate) => {
  createOrUpdate(role, {
    onSuccess: () => (showCreateDialog.value = false),
  })
}

const onDelete = () => {
  if (selectedRole.value?.id) {
    remove(selectedRole.value.id.toString(), {
      onSuccess: () => (showDeleteDialog.value = false),
    })
  }
}

fetchRoles()
</script>

<template>
  <div class="flex flex-col h-full">
    <Table
      :data="transformedData"
      :columns="columns"
      emptyMessage="roles.empty"
      :loading="loading"
    />

    <RoleDrawer
      v-model:visible="showCreateDialog"
      :title="selectedRole ? $t('roles.edit_role') : $t('roles.create_role')"
      :loading="loadingDrawer"
      :roleEdited="selectedRole"
      @onSave="onSave"
    />
    <WarningDialog
      v-model:visible="showDeleteDialog"
      :title="$t('roles.delete_role')"
      :message="$t('roles.delete_message')"
      @onConfirm="onDelete"
    />
  </div>
</template>
