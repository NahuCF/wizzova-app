import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '~/services'
import type { TeamItem } from '~/types'

export const useTeamStore = defineStore('team', () => {
  const teams = ref<TeamItem[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const showCreateDialog = ref(false)
  const selectedTeam = ref<TeamItem>()

  const fetchTeams = async (force = false) => {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    try {
      const response = await API.team.index()
      teams.value = response.data.data
      loaded.value = true
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    } finally {
      loading.value = false
    }
  }

  const $reset = () => {
    teams.value = []
    loading.value = false
    loaded.value = false
    showCreateDialog.value = false
    selectedTeam.value = undefined
  }

  return {
    teams,
    loading,
    showCreateDialog,
    selectedTeam,
    fetchTeams,
    $reset,
  }
})
