<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToast } from 'primevue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { useBroadcastStore } from '~/stores/broadcast'

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const broadcastStore = useBroadcastStore()
const { currentStep, newBroadcast, showMapDialog } = storeToRefs(broadcastStore)

const showLeaveDialog = ref(false)
const pendingNext = ref<Function | null>(null)
const success = ref(false)

const canSubmit = () => {
    const timeSelected = newBroadcast.value.scheduledDate && newBroadcast.value.scheduledTime

    return newBroadcast.value.name.trim() !== '' &&
        (newBroadcast.value.sendOption === 'SEND_NOW' || timeSelected )
}

const scheduleBroadcast = () => {
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: t('new_broadcast.broadcast_created'),
        life: 3000,
    })
    
    success.value = true
    router.push({ name: 'broadcasts' })
    broadcastStore.clear()
}

const confirmLeave = () => {
    broadcastStore.clear()
    showLeaveDialog.value = false
    if (pendingNext.value) pendingNext.value()
}

const cancelLeave = () => {
    showLeaveDialog.value = false
    if (pendingNext.value) pendingNext.value(false)
}

const goToSchedule = () => {
    if(newBroadcast.value.variables) {
        showMapDialog.value = true
    }
    else {
        currentStep.value++
    }
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
                    <Step :value="1">{{ $t('new_broadcast.select_template') }}</Step>
                    <Step :value="2">{{ $t('new_broadcast.select_audience') }}</Step>
                    <Step :value="3">{{ $t('new_broadcast.schedule_broadcast') }}</Step>
                </StepList>
                <StepPanels>
                    <StepPanel class="bg-transparent!" :value="1">
                        <TemplateStep v-if="currentStep === 1" />
                    </StepPanel>
                    <StepPanel class="bg-transparent!" :value="2">
                        <AudienceStep v-if="currentStep === 2" />
                    </StepPanel>
                    <StepPanel class="bg-transparent!" :value="3">
                        <ScheduleStep v-if="currentStep === 3" />
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </div>

        <div 
            v-if="currentStep === 2 || currentStep === 3" 
            class="sticky bottom-0 w-full flex justify-end items-center py-4 px-6 bg-white shadow z-100"
        >
            <div v-if="currentStep === 2" class="flex items-center gap-3">
                <div class="text-emerald-500" v-if="newBroadcast.contactGroups.length === 1">
                    {{ $t('new_broadcast.group_selected') }}
                </div>
                <div class="text-emerald-500" v-else-if="newBroadcast.contactGroups.length > 1">
                    {{ $t('new_broadcast.groups_selected', { groups: newBroadcast.contactGroups.length }) }}
                </div>
                <div class="text-emerald-500" v-else>
                    {{ $t('new_broadcast.no_group_selected') }}
                </div>
                <Button 
                    :disabled="newBroadcast.contactGroups.length === 0"
                    @click="goToSchedule"
                >
                    <span class="text-sm">
                        {{ $t('continue') }}
                    </span>
                </Button>
            </div>

            <div v-if="currentStep === 3" class="flex items-center gap-3">
                <Button
                    severity="secondary"
                    @click="router.push({ name: 'broadcasts' })"
                >
                    <span class="text-sm">
                        {{ $t('cancel') }}
                    </span>
                </Button>
                <Button 
                    :disabled="!canSubmit()"
                    @click="scheduleBroadcast"
                >
                    <span class="text-sm">
                        {{ $t('new_broadcast.schedule_broadcast') }}
                    </span>
                </Button>
            </div>
        </div>

        <Dialog v-model:visible="showLeaveDialog" modal :header="$t('unsaved_changes')" :closable="false">
            <p>{{ $t('unsaved_changes_message') }}</p>
            <template #footer>
                <Button :label="$t('cancel')" @click="cancelLeave" severity="secondary" />
                <Button :label="$t('leave')" @click="confirmLeave" severity="danger" />
            </template>
        </Dialog>
    </div>
</template>