<script setup lang="ts">
import { IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
import { API } from '~/services'
import { useUserStore, useSessionStore, useTeamStore } from '~/stores'
import { userStatusSeverity } from '~/types'
import type { UserCreate, UserItem,  UserStatus } from '~/types'

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
const optionsMenu = ref()
const columns = [
    { header: 'name', key: 'name' },
    { header: 'email', key: 'email' },
    { header: 'role', key:'roleName' },
    { header: 'status', key: 'status' }
]

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
const currentOptions = ref(userOptions.value)

const openActions = (event: Event, userItem: UserItem) => {
    if(userItem.role.is_internal && userItem.role.name === 'Owner') {
        currentOptions.value = [
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
        currentOptions.value = userOptions.value
    }

    optionsMenu.value?.show(event, userItem)
}

const transformedData = computed(() => {
	return users.value.map(user => ({
		...user,
		roleName: user.role.name
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
		<div class="overflow-auto">
            <DataTable 
                :value="transformedData" 
                dataKey="id" 
                class="rounded-lg overflow-hidden"
                :loading="loading"
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

				<Column v-if="hasPermission('settings.manage_user_roles_and_teams')" headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                    <template #body="{ data }: { data: UserItem }">
                        <div class="flex justify-center">
                            <Button v-if="!(data.role.is_internal && data.role.name === 'Owner') || isOwner" severity="secondary" variant="text" @click="(e: Event) => openActions(e, data)">
                                <div>
									<IconDotsVertical  size="13" />
								</div>
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

		<ActionsPopover ref="optionsMenu" :options="currentOptions" />
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