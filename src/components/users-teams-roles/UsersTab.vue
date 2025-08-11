<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
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

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<UserCreate>({
    api: {
        create: API.user.create,
        update: API.user.update,
        delete: API.user.delete
    },
    fetchData: () => {
        fetchUsers(true)
        fetchTeams(true)
    },
    i18nKeys: {
        created: 'users.user_created',
        updated: 'users.user_updated',
        deleted: 'users.user_deleted'
    }
})

const showDeleteDialog = ref(false)

const userOptions = ref([
    [
		{
			label: 'users.edit',
			icon: IconEdit,
			action: (user: UserItem) => {
				selectedUser.value = user
    			showCreateDialog.value = true
			}
		}
	],
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (user: UserItem) => {
                selectedUser.value = user
                showDeleteDialog.value = true
            }
		}
	]
])

const columns = computed(() => {
    let columnList: Column[] = [
        { header: t('users.headers.name'), key: 'name' },
        { header: t('users.headers.email'), key: 'email' },
        { header: t('users.headers.role'), key:'roleName' },
        { header: t('users.headers.status'), key: 'statusTag', type: 'TAG' }
    ]

    if(hasPermission('settings.manage_user_roles_and_teams')) {
        columnList = [
            ...columnList,
            { header: '', key: 'actions', type: 'ACTIONS' }
        ]
    }

    return columnList
})

const filterActions = (userItem: UserItem) => {
    if((userItem.role.is_internal && userItem.role.name === 'Owner') && !isOwner) {
        return []
    }
    else if(userItem.role.is_internal && userItem.role.name === 'Owner') {
        return [
            [
                {
                    label: 'users.edit',
                    icon: IconEdit,
                    action: (user: UserItem) => {
                        selectedUser.value = user
                        showCreateDialog.value = true
                    }
                }
            ]
        ]
    }
    else {
        return userOptions.value
    }
}

const transformedData = computed(() => {
	return users.value.map(user => ({
		...user,
		roleName: user.role.name,
        statusTag: {
            label: t(`users.status.${user.status}`),
            severity: userStatusSeverity[user.status]
        },
        actions: filterActions(user)
	}))
})

const onSave = (user: UserCreate) => {
    createOrUpdate(user, {
        onSuccess: () => showCreateDialog.value = false
    })
}

const onDelete = () => {
	if (selectedUser.value?.id) {
        remove(selectedUser.value.id, {
            onSuccess: () => {
                showDeleteDialog.value = false
                fetchDeletedUsers(true)
            }
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
        />

		<UserDrawer
            v-model:visible="showCreateDialog"
            :title="selectedUser ? $t('users.edit_user') : $t('users.create_user')"
            :loading="loadingDrawer"
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