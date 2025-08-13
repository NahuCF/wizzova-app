<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useUserStore, useSessionStore } from '~/stores'
import { userStatusSeverity } from '~/types'
import type { Column, UserItem } from '~/types'

const { hasPermission } = useSessionStore()
const userStore = useUserStore()
const { fetchDeletedUsers, fetchUsers } = userStore
const { loadingDeleted: loading, deletedUsers: users } = storeToRefs(userStore)

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const selectedUser = ref<UserItem>()
const showRestoreDialog = ref(false)
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
            { header: '', key: 'restore', type: 'CUSTOM' }
        ]
    }

    return columnList
})

const onRestoreUser = (user: UserItem) => {
	selectedUser.value = user
    showRestoreDialog.value = true
}

const onRestore = async () => {
	try {
        showRestoreDialog.value = false

		await API.user.restore(selectedUser.value?.id || '')

		toast.add({
			severity: 'success',
			summary: 'Success',
			detail: t('deleted_users.restored'),
			life: 3000,
		})
        
        fetchDeletedUsers(true)
        fetchUsers(true)
	} catch(error) {
		handleError(error)
	}
}

const transformedData = computed(() => {
	return users.value.map(user => ({
		...user,
		roleName: user.role.name,
        statusTag: {
            label: t(`users.status.${user.status}`),
            severity: userStatusSeverity[user.status]
        }
	}))
})

fetchDeletedUsers()
</script>

<template>
	<div class="flex flex-col h-full">
        <Table 
            :data="transformedData"
            :columns="columns"
            emptyMessage="users.empty"
            :loading="loading"
        >
            <template #restore="{ data }: { data: UserItem }">
                <div class="flex justify-center">
                    <Button severity="secondary" @click="onRestoreUser(data)" size="small">
                        <div>
                            {{ $t('deleted_users.restore') }}
                        </div>
                    </Button>
                </div>
            </template>
        </Table>

		<WarningDialog
			v-model:visible="showRestoreDialog" 
			:title="$t('deleted_users.restore_title')"
			:message="$t('deleted_users.restore_message')"
            :confirmMessage="$t('restore')"
			@onConfirm="onRestore" 
		/>
	</div>
</template>