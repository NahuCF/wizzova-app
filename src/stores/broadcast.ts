import { defineStore } from "pinia"
import { computed, ref, watchEffect } from "vue"
import type { WABANumber, ContactGroupItem, TemplateItem, VariableMapping } from "~/types"

interface CreateBroadcast {
    name: string,
    sendOption: 'SEND_NOW' | 'SCHEDULE_LATER',
    broadcastNumber?: WABANumber,
    template?: TemplateItem,
    contactGroups: ContactGroupItem[],
    scheduledDate?: Date,
    scheduledTime?: Date,
    variables?: VariableMapping[]
}

export const useBroadcastStore = defineStore('broadcast', () => {
    const currentStep = ref(1)
    const newBroadcast = ref<CreateBroadcast>({
        name: '',
        contactGroups: [],
        sendOption: 'SEND_NOW'
    })
    const showMapDialog = ref(false)

    const totalContactsCount = computed(() => {
        return newBroadcast.value.contactGroups.reduce((total, group) => total + group.contact_count, 0)
    })

    const getVariableMapping = (name: string) => {
        return newBroadcast.value.variables?.find(v => v.name === name)!
    }

    const clear = () => {
        currentStep.value = 1
        newBroadcast.value = {
            name: '',
            contactGroups: [],
            sendOption: 'SEND_NOW'
        }
        newBroadcast.value.variables = undefined
        showMapDialog.value = false
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
            c.variables = c.template.components.body.variables.map(variable => ({
                name: variable.name,
                value: '',
                contact_field_id: variable.contact_field_id
            }))
        }
    })

    const $reset = () => {
        currentStep.value = 1
        newBroadcast.value = {
            name: '',
            contactGroups: [],
            sendOption: 'SEND_NOW'
        }
        showMapDialog.value = false
    }

    return {
        currentStep,
        newBroadcast,
        showMapDialog,
        totalContactsCount,
        getVariableMapping,
        clear,
        $reset
    }
}, {
    persist: true
})