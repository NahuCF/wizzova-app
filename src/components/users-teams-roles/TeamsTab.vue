<script setup lang="ts">
import { IconEdit, IconTrash, IconDotsVertical } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useCrudActions } from '~/composables/useCrudActions'
import { API } from '~/services'
import { useSessionStore, useTeamStore, useUserStore } from '~/stores'
import type { TeamCreate, TeamItem } from '~/types'

const { hasPermission } = useSessionStore()
const teamStore = useTeamStore()
const userStore = useUserStore()
const { fetchTeams } = teamStore
const { fetchUsers } = userStore
const { loading, teams, showCreateDialog, selectedTeam } = storeToRefs(teamStore)

const {
    loading: loadingDrawer,
    createOrUpdate,
    remove
} = useCrudActions<TeamCreate>({
    api: {
        create: API.team.create,
        update: API.team.update,
        delete: API.team.delete
    },
    fetchData: () => {
        fetchTeams(true)
        fetchUsers(true)
    },
    i18nKeys: {
        created: 'teams.team_created',
        updated: 'teams.team_updated',
        deleted: 'teams.team_deleted'
    }
})

const showDeleteDialog = ref(false)
const optionsMenu = ref()
const columns = [
    { header: 'name', key: 'name' },
    { header: 'created_by', key: 'createdBy' },
    { header: 'users_count', key:'users_count' }
]

const teamOptions = ref([
    [
		{
			label: 'teams.edit',
			icon: IconEdit,
			action: (team: TeamItem) => {
                selectedTeam.value = team
                showCreateDialog.value = true
            }
		}
	],
	[
		{
			label: 'delete',
			class: 'text-red-600',
			icon: IconTrash,
			action: (team: TeamItem) => {
                selectedTeam.value = team
                showDeleteDialog.value = true
            }
		}
	]
])

const transformedData = computed(() => {
	return teams.value.map(team => ({
		...team,
        createdBy: team.owner.name
	}))
})

const onSave = (team: TeamCreate) => {
    createOrUpdate(team, {
        onSuccess: () => showCreateDialog.value = false
    })
}

const onDelete = () => {
	if (selectedTeam.value?.id) {
        remove(selectedTeam.value.id, {
            onSuccess: () => showDeleteDialog.value = false
        })
    }
}

fetchTeams()
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
                        {{ $t('teams.empty') }}
                    </div>
                </template>

                <Column v-for="column in columns" :key="column.header" headerClass="bg-slate-200!">
                    <template #header>
                        <div class="uppercase text-sm font-semibold">
                            {{ $t(`teams.headers.${column.header}`) }}
                        </div>
                    </template>

                    <template #body="{ data }">
                        <span class="block whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                            {{ data[column.key] }}
                        </span>
                    </template>
                </Column>

				<Column v-if="hasPermission('settings.manage_user_roles_and_teams')" headerClass="bg-slate-200!" :bodyStyle="{ maxWidth: '50px' }">
                    <template #body="{ data }: { data: TeamItem }">
                        <div class="flex justify-center">
                            <Button severity="secondary" variant="text" @click="(e: Event) => optionsMenu?.show(e, data)">
                                <div>
									<IconDotsVertical  size="13" />
								</div>
                            </Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

		<ActionsPopover ref="optionsMenu" :options="teamOptions" />
        <TeamDrawer
            v-model:visible="showCreateDialog"
            :title="selectedTeam ? $t('teams.edit_team') : $t('teams.create_team')"
            :loading="loadingDrawer"
            :teamEdited="selectedTeam"
            @onSave="onSave"
        />
		<WarningDialog
			v-model:visible="showDeleteDialog" 
			:title="$t('teams.delete_team')"
			:message="$t('teams.delete_message')"
			@onConfirm="onDelete" 
		/>
	</div>
</template>