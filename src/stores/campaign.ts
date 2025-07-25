import { defineStore } from "pinia"
import { computed, ref, watchEffect } from "vue"
import type { BroadcastNumber, ContactGroupItem, TemplateItem } from "~/types"

interface CreateCampaign {
    name: string,
    sendOption: 'SEND_NOW' | 'SCHEDULE_LATER',
    broadcastNumber?: BroadcastNumber,
    template?: TemplateItem,
    contactGroups: ContactGroupItem[],
    scheduledDate?: Date,
    scheduledTime?: Date
}

export const useCampaignStore = defineStore('campaign', () => {
    const currentStep = ref(1)
    const newCampaign = ref<CreateCampaign>({
        name: '',
        contactGroups: [],
        sendOption: 'SEND_NOW'
    })

    const totalContactsCount = computed(() => {
        return newCampaign.value.contactGroups.reduce((total, group) => total + group.contact_count, 0)
    })

    const clear = () => {
        currentStep.value = 1
        newCampaign.value = {
            name: '',
            contactGroups: [],
            sendOption: 'SEND_NOW'
        }
    }

    watchEffect(() => {
        const c = newCampaign.value
        if (typeof c.scheduledDate === 'string') {
            c.scheduledDate = new Date(c.scheduledDate)
        }
        if (typeof c.scheduledTime === 'string') {
            c.scheduledTime = new Date(c.scheduledTime)
        }
    })

    return {
        currentStep,
        newCampaign,
        totalContactsCount,
        clear
    }
}, {
    persist: true
})