<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useCampaignStore } from '~/stores/campaign'

const campaignStore = useCampaignStore()
const { currentStep, newCampaign } = storeToRefs(campaignStore)

const toPrevStep = () => {
    currentStep.value--
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex justify-between pt-2.5">
			<div class="flex items-center gap-2">
                <Button variant="text" @click="toPrevStep" size="small" severity="secondary">
                    <IconArrowLeft size="18" />
                </Button>
                <h1 class="font-semibold text-lg">{{ $t('new_campaign.select_audience') }}</h1>
            </div>
        </div>

        <ContactGroupsTab v-model:selectedGroups="newCampaign.contactGroups" />
    </div>
</template>