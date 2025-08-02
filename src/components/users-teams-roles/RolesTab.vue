<script setup lang="ts">
import { IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import { useRoleStore } from '~/stores/role'
import type { RoleCreate, RoleItem } from '~/types/User'

const { hasPermission } = useSessionStore()
const roleStore = useRoleStore()
const { fetchRoles } = roleStore
const { loading, roles, selectedRole, showCreateDialog } = storeToRefs(roleStore)

const { t } = useI18n()

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<RoleCreate>({
    api: {
        create: API.role.create,
        update: API.role.update,
        delete: API.role.delete
    },
    fetchData: () => fetchRoles(true),
    i18nKeys: {
        created: 'roles.role_created',
        updated: 'roles.role_updated',
        deleted: 'roles.role_deleted'
    }
})

const showDeleteDialog = ref(false)
const optionsMenu = ref()
const columns = [
    { header: 'name', key: 'name' },
    { header: 'created_by', key: 'createdBy' }
]

const roleOptions = ref([
    [
		{
			label: 'roles.edit',
			icon: IconEdit,
			action: (role: RoleItem) => {
                selectedRole.value = role
                showCreateDialog.value = true
            }
		}
	],
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (role: RoleItem) => {
                selectedRole.value = role
                showDeleteDialog.value = true
            }
		}
	]
])

const transformedData = computed(() => {
	return roles.value.map(role => ({
		...role,
		createdBy: role.user?.name || t('roles.system')
	}))
})

const onSave = (role: RoleCreate) => {
    createOrUpdate(role, {
        onSuccess: () => showCreateDialog.value = false
    })
}

const onDelete = () => {
	if (selectedRole.value?.id) {
        remove(selectedRole.value.id.toString(), {
            onSuccess: () => showDeleteDialog.value = false
        })
    }
}

fetchRoles()
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
                :totalRecords="roles.length" 
                scrollable
                scrollHeight="flex"
            >
                <template #empty>
                    <div class="text-center text-sm py-4 text-gray-500">
                        {{ $t('roles.empty') }}
                    </div>
                </template>

                <Column v-for="column in columns" :key="column.header" headerClass="bg-slate-200!">
                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`roles.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }">
                        <span class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                            {{ data[column.key] }}
                        </span>
                    </template>
                </Column>

				<Column v-if="hasPermission('settings.manage_user_roles_and_teams')" headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                    <template #body="{ data }: { data: RoleItem }">
                        <div class="flex justify-center">
                            <Button v-if="!data.is_internal" severity="secondary" variant="text" @click="(e: Event) => optionsMenu?.show(e, data)">
                                <div>
									<IconDotsVertical  size="13" />
								</div>
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

		<ActionsPopover ref="optionsMenu" :options="roleOptions" />
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