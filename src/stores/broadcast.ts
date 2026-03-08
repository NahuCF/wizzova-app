import moment from 'moment'
import { defineStore } from 'pinia'
import { computed, ref, watch, watchEffect } from 'vue'
import type { WABANumber, ContactGroupItem, TemplateItem, VariableMapping } from '~/types'
import { API } from '~/services'

interface CreateBroadcast {
  name: string
  sendOption: 'SEND_NOW' | 'SCHEDULE_LATER'
  sendToAll: boolean
  broadcastNumber?: WABANumber
  template?: TemplateItem
  contactGroups: ContactGroupItem[]
  scheduledDate?: Date
  scheduledTime?: Date
  variables?: VariableMapping[]
}

export const useBroadcastStore = defineStore(
  'broadcast',
  () => {
    const currentStep = ref(1)
    const newBroadcast = ref<CreateBroadcast>({
      name: '',
      contactGroups: [],
      sendOption: 'SEND_NOW',
      sendToAll: false,
    })
    const showMapDialog = ref(false)

    const totalContactsCount = computed(() => {
      return newBroadcast.value.contactGroups.reduce(
        (total, group) => total + group.contact_count,
        0,
      )
    })

    const recipientsCount = ref(0)
    const loadingRecipientsCount = ref(false)

    const fetchRecipientsCount = async () => {
      const groupIds = newBroadcast.value.contactGroups.map((g) => g.id)
      if (groupIds.length === 0) {
        recipientsCount.value = 0
        return
      }

      loadingRecipientsCount.value = true
      try {
        const { data } = await API.broadcast.recipientsCount(
          groupIds,
          newBroadcast.value.sendToAll,
        )
        recipientsCount.value = data.recipients_count
      } catch {
        recipientsCount.value = 0
      } finally {
        loadingRecipientsCount.value = false
      }
    }

    watch(
      () => [
        newBroadcast.value.contactGroups.map((g) => g.id).join(','),
        newBroadcast.value.sendToAll,
      ],
      () => fetchRecipientsCount(),
    )

    const scheduledAt = computed(() => {
      if (!newBroadcast.value.scheduledDate || !newBroadcast.value.scheduledTime) return null

      return moment(newBroadcast.value.scheduledDate)
        .hour(newBroadcast.value.scheduledTime.getHours())
        .minute(newBroadcast.value.scheduledTime.getMinutes())
        .second(newBroadcast.value.scheduledTime.getSeconds())
        .format('YYYY-MM-DD HH:mm:ss')
    })

    const getVariableMapping = (name: string) => {
      return newBroadcast.value.variables?.find((v) => v.name === name)!
    }

    watchEffect(() => {
      const c = newBroadcast.value

      if (typeof c.scheduledDate === 'string') {
        c.scheduledDate = new Date(c.scheduledDate)
      }
      if (typeof c.scheduledTime === 'string') {
        c.scheduledTime = new Date(c.scheduledTime)
      }

      if (c.template && !c.variables && c.template.components.body.variables) {
        // Initialize mapped variables
        c.variables = c.template.components.body.variables.map((variable) => ({
          name: variable.name,
          value: '',
          contact_field_id: variable.contact_field_id,
        }))
      }
    })

    const $reset = () => {
      currentStep.value = 1
      newBroadcast.value = {
        name: '',
        contactGroups: [],
        sendOption: 'SEND_NOW',
        sendToAll: false,
      }
      newBroadcast.value.variables = undefined
      showMapDialog.value = false
    }

    return {
      currentStep,
      newBroadcast,
      showMapDialog,
      totalContactsCount,
      recipientsCount,
      loadingRecipientsCount,
      scheduledAt,
      getVariableMapping,
      $reset,
    }
  },
  {
    persist: true,
  },
)
