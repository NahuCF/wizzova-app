<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconArrowLeft, IconUsers, IconClock, IconAsterisk } from '@tabler/icons-vue'
import { useCampaignStore } from '~/stores/campaign'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { t } = useI18n()
const campaignStore = useCampaignStore()
const { currentStep, newCampaign, totalContactsCount } = storeToRefs(campaignStore)

const sendOptions = ref([
    {
        name: t('new_campaign.send_now'),
        value: 'SEND_NOW'
    },
    {
        name: t('new_campaign.schedule_later'),
        value: 'SCHEDULE_LATER'
    }
])

const toPrevStep = () => {
    currentStep.value--
}
</script> 

<template>
    <div class="flex gap-16 pt-2.5">
        <div class="flex flex-col gap-10 w-full">
            <div class="flex justify-between">
                <div class="flex items-center gap-2">
                    <Button variant="text" @click="toPrevStep" size="small" severity="secondary">
                        <IconArrowLeft size="18" />
                    </Button>
                    <h1 class="font-semibold text-lg">{{ t('new_campaign.schedule_campaign') }}</h1>
                </div>
            </div>

            <div>
                <div class="text-lg font-bold text-gray-500 pb-2">
                    {{ t('new_campaign.campaign_details') }}
                </div>
                <div class="flex bg-white border-1 border-slate-200 p-6 rounded-lg">
                    <div class="flex flex-col w-full gap-8">
                        <div class="flex items-center">
                            <div class="flex gap-1 min-w-[30%]">
                                <label for="name">{{ t('new_campaign.campaign_name') }}</label>
                                <IconAsterisk color="red" class="mt-1" size="8" />
                            </div>

                            <InputText 
                                v-model="newCampaign.name"
                                class="w-full"
                                :placeholder="t('new_campaign.enter_campaign_name')"
                                size="small" 
                            />
                        </div>

                        <div class="flex items-center">
                            <div class="flex gap-1 min-w-[30%]">
                                <label for="name">{{ t('new_campaign.send_campaign') }}</label>
                                <IconAsterisk color="red" class="mt-1" size="8" />
                            </div>

                            <div class="flex gap-2 text-ellipsis w-full">
                                <Select 
                                    id="sendOptions"
                                    class="w-full"
                                    v-model="newCampaign.sendOption" 
                                    :options="sendOptions"
                                    option-label="name"
                                    option-value="value"
                                    size="small"
                                />

                                <DatePicker
                                    v-if="newCampaign.sendOption === 'SCHEDULE_LATER'"
                                    v-model="newCampaign.scheduledDate"
                                    class="w-full"
                                    showIcon
                                    iconDisplay="input"
                                    dateFormat="yy/mm/dd"
                                    mask="9999/99/99"
                                    :placeholder="t('new_campaign.schedule_on')"
                                    size="small"
                                />
                                <div class="w-full" v-else></div>

                                <DatePicker
                                    v-if="newCampaign.sendOption === 'SCHEDULE_LATER'"
                                    v-model="newCampaign.scheduledTime"
                                    class="w-full"
                                    showIcon
                                    iconDisplay="input"
                                    :placeholder="t('new_campaign.schedule_at')"
                                    size="small"
                                    hourFormat="12"
                                    :stepMinute="15"
                                    timeOnly
                                >
                                    <template #inputicon="slotProps">
                                        <IconClock size="16" @click="slotProps.clickCallback" />
                                    </template>
                                </DatePicker>
                                <div class="w-full" v-else></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div class="text-lg font-bold text-gray-500 pb-2">
                    {{ t('new_campaign.target_audience') }}
                </div>
                <div class="flex bg-white border-1 border-slate-200 p-6 rounded-lg text-sm">
                    <div class="flex flex-col w-full gap-6">
                        <div class="flex items-center">
                            <div class="min-w-[30%]">{{ t('new_campaign.total_contacts') }}</div>

                            <div class="flex gap-2">
                                <IconUsers size="16 "/>
                                <div>{{ totalContactsCount }}</div>
                            </div>
                        </div>

                        <div class="flex items-center">
                            <div class="min-w-[30%]">{{ t('new_campaign.selected_groups') }}</div>

                            <div class="flex gap-2 text-ellipsis">
                                <Badge
                                    v-for="group in newCampaign.contactGroups"
                                    severity="secondary"
                                >
                                    {{ group.name }}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex min-w-[350px]">
            <TemplateCard
                v-if="newCampaign.template"
                class="h-[420px]"
                :template="newCampaign.template"
                :broadcastNumber="newCampaign.broadcastNumber"
            />
        </div>
    </div>
</template>