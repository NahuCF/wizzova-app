<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useCampaignStore } from '~/stores/campaign'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const campaignStore = useCampaignStore()
const { currentStep, newCampaign } = storeToRefs(campaignStore)

const showLeaveDialog = ref(false)
const pendingNext = ref<Function | null>(null)
const success = ref(false)

const canSubmit = () => {
    const timeSelected = newCampaign.value.scheduledDate && newCampaign.value.scheduledTime

    return newCampaign.value.name.trim() !== '' &&
        (newCampaign.value.sendOption === 'SEND_NOW' || timeSelected )
}

const scheduleCampaign = () => {
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: t('new_campaign.campaign_created'),
        life: 3000,
    })
    
    success.value = true
    router.push({ name: 'campaigns' })
    campaignStore.clear()
}

const confirmLeave = () => {
    campaignStore.clear()
    showLeaveDialog.value = false
    if (pendingNext.value) pendingNext.value()
}

const cancelLeave = () => {
    showLeaveDialog.value = false
    if (pendingNext.value) pendingNext.value(false)
}

onBeforeRouteLeave((to, from, next) => {
    if(success.value === true || to.name === 'new-template') {
        next()
    }
    
    showLeaveDialog.value = true
    pendingNext.value = next
})
</script>

<template>
    <div class="flex flex-col justify-between h-full">
        <div class="flex flex-col w-full p-6">
            <Stepper v-model:value="currentStep" linear>
                <StepList class="flex xl:px-70! ">
                    <Step :value="1">{{ $t('new_campaign.select_template') }}</Step>
                    <Step :value="2">{{ $t('new_campaign.select_audience') }}</Step>
                    <Step :value="3">{{ $t('new_campaign.schedule_campaign') }}</Step>
                </StepList>
                <StepPanels>
                    <StepPanel class="bg-transparent!" :value="1">
                        <TemplateStep />
                    </StepPanel>
                    <StepPanel class="bg-transparent!" :value="2">
                        <AudienceStep />
                    </StepPanel>
                    <StepPanel class="bg-transparent!" :value="3">
                        <ScheduleStep />
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </div>

        <div 
            v-if="currentStep === 2 || currentStep === 3" 
            class="sticky bottom-0 w-full flex justify-end items-center py-4 px-6 bg-white shadow z-100"
        >
            <div v-if="currentStep === 2" class="flex items-center gap-3">
                <div class="text-emerald-500" v-if="newCampaign.contactGroups.length === 1">
                    {{ $t('new_campaign.group_selected') }}
                </div>
                <div class="text-emerald-500" v-else-if="newCampaign.contactGroups.length > 1">
                    {{ $t('new_campaign.groups_selected', { groups: newCampaign.contactGroups.length }) }}
                </div>
                <div class="text-emerald-500" v-else>
                    {{ $t('new_campaign.no_group_selected') }}
                </div>
                <Button 
                    :disabled="newCampaign.contactGroups.length === 0"
                    @click="currentStep++"
                >
                    <span class="text-sm">
                        {{ $t('continue') }}
                    </span>
                </Button>
            </div>

            <div v-if="currentStep === 3" class="flex items-center gap-3">
                <Button
                    severity="secondary"
                    @click="router.push({ name: 'campaigns' })"
                >
                    <span class="text-sm">
                        {{ $t('cancel') }}
                    </span>
                </Button>
                <Button 
                    :disabled="!canSubmit()"
                    @click="scheduleCampaign"
                >
                    <span class="text-sm">
                        {{ $t('new_campaign.schedule_campaign') }}
                    </span>
                </Button>
            </div>
        </div>

        <Dialog v-model:visible="showLeaveDialog" modal header="Unsaved Changes" :closable="false">
            <p>{{ $t('unsaved_changes') }}</p>
            <template #footer>
                <Button :label="$t('cancel')" @click="cancelLeave" severity="secondary" />
                <Button :label="$t('leave')" @click="confirmLeave" severity="danger" />
            </template>
        </Dialog>
    </div>
</template>