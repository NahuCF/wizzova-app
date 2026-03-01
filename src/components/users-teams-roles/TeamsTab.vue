<script setup lang="ts">
import { IconEdit, IconTrash } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudActions } from '~/composables/useCrudActions'
import { API } from '~/services'
import { useSessionStore, useTeamStore, useUserStore } from '~/stores'
import type { Column, TeamCreate, TeamItem } from '~/types'

const { hasPermission } = useSessionStore()
const teamStore = useTeamStore()
const userStore = useUserStore()
const { fetchTeams } = teamStore
const { fetchUsers } = userStore
const { loading, teams, showCreateDialog, selectedTeam } = storeToRefs(teamStore)

const { t } = useI18n()

const {
  loading: loadingDrawer,
  createOrUpdate,
  remove,
} = useCrudActions<TeamCreate>({
  api: {
    create: API.team.create,
    update: API.team.update,
    delete: API.team.delete,
  },
  fetchData: () => {
    fetchTeams(true)
    fetchUsers(true)
  },
  i18nKeys: {
    created: 'teams.team_created',
    updated: 'teams.team_updated',
    deleted: 'teams.team_deleted',
  },
})

const showDeleteDialog = ref(false)
const teamActions = (team: TeamItem) => [
  [
    {
      label: t('teams.edit'),
      icon: IconEdit,
      action: () => {
        selectedTeam.value = team
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
        selectedTeam.value = team
        showDeleteDialog.value = true
      },
    },
  ],
]

const columns = computed(() => {
  let columnList: Column[] = [
    { header: t('teams.headers.name'), key: 'name' },
    { header: t('teams.headers.created_by'), key: 'createdBy' },
    { header: t('teams.headers.users_count'), key: 'users_count' },
  ]

  if (hasPermission('settings.manage_user_roles_and_teams')) {
    columnList = [...columnList, { header: '', key: 'actions', type: 'ACTIONS' }]
  }

  return columnList
})

const transformedData = computed(() => {
  return teams.value.map((team) => ({
    ...team,
    createdBy: team.owner.name,
    actions: teamActions,
  }))
})

const onSave = (team: TeamCreate) => {
  createOrUpdate(team, {
    onSuccess: () => (showCreateDialog.value = false),
  })
}

const onDelete = () => {
  if (selectedTeam.value?.id) {
    remove(selectedTeam.value.id, {
      onSuccess: () => (showDeleteDialog.value = false),
    })
  }
}

fetchTeams()
</script>

<template>
  <div class="flex flex-col h-full">
    <Table
      :data="transformedData"
      :columns="columns"
      emptyMessage="teams.empty"
      :loading="loading"
    />

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
