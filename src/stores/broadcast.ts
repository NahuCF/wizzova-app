import moment from 'moment'
import { defineStore } from 'pinia'
import { computed, ref, watchEffect } from 'vue'
import type { WABANumber, ContactGroupItem, TemplateItem, VariableMapping } from '~/types'

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

    const scheduledAt = computed(() => {
      if (!newBroadcast.value.scheduledDate || !newBroadcast.value.scheduledTime) return null

      return moment(newBroadcast.value.scheduledDate)
        .hour(newBroadcast.value.scheduledTime.getHours())
        .minute(newBroadcast.value.scheduledTime.getMinutes())
        .second(newBroadcast.value.scheduledTime.getSeconds())
        .toISOString()
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
      scheduledAt,
      getVariableMapping,
      $reset,
    }
  },
  {
    persist: true,
  },
)
