<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconSearch, IconPlus } from '@tabler/icons-vue'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { BroadcastNumber, TemplateItem } from '~/types'
import { ref } from 'vue'
import { useCampaignStore } from '~/stores/campaign'
import { storeToRefs } from 'pinia'

const router = useRouter()
const campaignStore = useCampaignStore()
const { currentStep, newCampaign } = storeToRefs(campaignStore)

const {
  dataPage,
  loading,
  searchTerm,
  fetchDataPage,
  loadNextPage,
  debouncedFetch,
} = usePaginatedData<TemplateItem>(
  (page, perPage, search) => API.template.index(page, search, perPage).then(res => res.data),
  12
)

const loadingNumbers = ref(false)
const broadcastNumbers = ref<BroadcastNumber[]>([])

const fetchBroadcastNumbers = async () => {
    loadingNumbers.value = true
    try {
        const { data: response } = await API.campaign.broadcastNumbers()
        broadcastNumbers.value = response

        if(!newCampaign.value.broadcastNumber && broadcastNumbers.value.length > 0) {
            newCampaign.value.broadcastNumber = broadcastNumbers.value[0]
        }
    } catch(error) {
        console.log(error)
    } finally {
        loadingNumbers.value = false
    }
}

const onTemplateSelected = (template: TemplateItem) => {
    newCampaign.value.template = template
    
    if(newCampaign.value.broadcastNumber) {
        currentStep.value++
    }
}

fetchDataPage(1)
fetchBroadcastNumbers()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex justify-between py-2.5">
			<div class="flex items-center gap-2">
                <Button variant="text" @click="router.push({ name: 'campaigns' })" size="small" severity="secondary">
                    <IconArrowLeft size="18" />
                </Button>
                <div>
                    <h1 class="font-semibold text-lg">{{ $t('new_campaign.select_template') }}</h1>
                    <div class="font-light">{{ $t('new_campaign.select_template_subtitle') }}</div>
                </div>
            </div>

            <div class="flex flex-col justify-center">
                <div class="flex gap-2">
                    <div class="relative">
                        <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <InputText
                            v-model="searchTerm"
                            class="pl-8! max-w-[180px] text-sm! shadow-none!"
                            name="search"
                            id="search"
                            fluid
                            :placeholder="$t('search')"
                            @input="debouncedFetch()"
                        />
                    </div>

                    <Select 
                        id="broadcastNumbers" 
                        v-model="newCampaign.broadcastNumber" 
                        :options="broadcastNumbers" 
                        option-id="id"
                        option-label="name" 
                        size="small"
                        :placeholder="$t('campaigns.select_number')"
                        :loading="loadingNumbers"
                        :disabled="loadingNumbers"
                    />

                    <Button 
                        @click="router.push({ 
                            name: 'new-template', 
                            query: { redirectTo: 'new-campaign' }
                        })"
                    >
                        <IconPlus size="16" class="mr-1" />
                        <span class="text-sm">
                            {{ $t('new_campaign.add_template') }}
                        </span>
                    </Button>
                </div>
            </div>
		</div>

        <div 
            v-if="dataPage.data.length === 0 && !loading"
            class="flex flex-col justify-center items-center py-20 gap-10"
        >
            <div class="text-3xl font-semibold text-center max-w-[500px]">{{ $t('new_campaign.missing_template_description') }}</div>
            <Button
                @click="router.push({ 
                    name: 'new-template', 
                    query: { redirectTo: 'new-campaign' }
                })"
            >
                <span class="text">
                    {{ $t('new_campaign.add_template') }}
                </span>
            </Button>
        </div>

        <TemplateCardList
            v-else
            :templates="dataPage.data"
            :loading="loading"
            :cardProps="{
                clickable: true
            }"
            @reach-end="loadNextPage"
            @select="onTemplateSelected"
        />
    </div>
</template>