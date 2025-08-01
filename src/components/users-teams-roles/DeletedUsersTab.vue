<script setup lang="ts">
import axios from 'axios'
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { API } from '~/services'
import { useUserStore } from '~/stores'
import { userStatusSeverity } from '~/types'
import type { UserItem,  UserStatus } from '~/types'

const userStore = useUserStore()
const { fetchDeletedUsers, fetchUsers } = userStore
const { loadingDeleted: loading, deletedUsers: users } = storeToRefs(userStore)

const { t } = useI18n()
const toast = useToast()

const selectedUser = ref<UserItem>()
const showRestoreDialog = ref(false)
const columns = [
    { header: 'name', key: 'name' },
    { header: 'email', key: 'email' },
    { header: 'role', key:'roleName' },
    { header: 'status', key: 'status' }
]

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
		console.log(error)
		let message = t('an_error_occurred')

        if (axios.isAxiosError(error) && error.status === 422 && error.response) {
            const errorKey = error.response.data.message?.replace('.', '')
            message = t(`validation_errors.${errorKey}`)
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000,
        })
	}
}

const transformedData = computed(() => {
	return users.value.map(user => ({
		...user,
		roleName: user.role.name
	}))
})

fetchDeletedUsers()
</script>

<template>
	<div>
		<div class="overflow-auto">
            <DataTable 
                :value="transformedData" 
                dataKey="id" 
                class="rounded-lg overflow-hidden" 
                :paginator="true" 
                :loading="loading" 
                :rows="10" 
                :totalRecords="users.length" 
                scrollable
                scrollHeight="flex"
            >
                <template #empty>
                    <div class="text-center text-sm py-4 text-gray-500">
                        {{ $t('users.empty') }}
                    </div>
                </template>

                <Column v-for="column in columns" :key="column.header" headerClass="bg-slate-200!">
                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`users.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }">
                        <Tag v-if="column.header === 'status'" :value="$t(`users.status.${data[column.key]}`)"
                            :severity="userStatusSeverity[data[column.key] as UserStatus]" size="small" />

                        <span v-else class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                            {{ data[column.key] }}
                        </span>
                    </template>
                </Column>

				<Column headerClass="bg-slate-200!">
                    <template #body="{ data }: { data: UserItem }">
                        <div class="flex justify-center">
                            <Button severity="secondary" @click="onRestoreUser(data)" size="small">
                                <div>
									{{ $t('deleted_users.restore') }}
								</div>
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

		<WarningDialog
			v-model:visible="showRestoreDialog" 
			:title="$t('deleted_users.restore_title')"
			:message="$t('deleted_users.restore_message')"
            :confirmMessage="$t('restore')"
			@onConfirm="onRestore" 
		/>
	</div>
</template>