import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API } from '~/services'

export const useBotStore = defineStore('bot', () => {
  const bots = ref<{ id: string; name: string }[]>([])
  const variables = ref<{ id: string; name: string }[]>([])
  const loading = ref(false)
  const loaded = ref(false)

  const fetchBots = async (force = false) => {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    try {
      const { data: response } = await API.bot.indexWithoutPagination({
        with_relationships: false,
        columns: ['id', 'name'],
      })

      bots.value = response.data
      loaded.value = true
    } catch (error) {
      console.error('Failed to fetch bots:', error)
    } finally {
      loading.value = false
    }
  }

  const fetchVariables = async (force = false) => {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    try {
      const { data: response } = await API.bot.variables()

      variables.value = response.data
      loaded.value = true
    } catch (error) {
      console.error('Failed to fetch bot variables:', error)
    } finally {
      loading.value = false
    }
  }

  const $reset = () => {
    bots.value = []
    variables.value = []
    loading.value = false
    loaded.value = false
  }

  return {
    bots,
    variables,
    loading,
    $reset,
    fetchBots,
    fetchVariables,
  }
})
