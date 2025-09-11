<script setup lang="ts">
import { useRouter } from 'vue-router'
import { IconArrowLeft, IconSearch, IconPlus } from '@tabler/icons-vue'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import type { WABANumber, TemplateItem } from '~/types'
import { ref } from 'vue'
import { useBroadcastStore } from '~/stores/broadcast'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '~/stores'

const router = useRouter()
const broadcastStore = useBroadcastStore()
const session = useSessionStore()
const { currentStep, newBroadcast } = storeToRefs(broadcastStore)

const {
    dataPage,
    loading,
    searchTerm,
    fetchDataPage,
    loadNextPage,
    debouncedFetch,
} = usePaginatedData<TemplateItem>(
    (page, perPage, search) => API.template.index({ page, name: search, perPage, status: 'APPROVED' })
        .then(res => res.data),
    12
)

const loadingNumbers = ref(false)
const broadcastNumbers = ref<WABANumber[]>([])

const fetchBroadcastNumbers = async () => {
    if(!session.defaultWaba) return

    loadingNumbers.value = true
    try {
        const { data: response } = await API.broadcast.broadcastNumbers(session.defaultWaba.id)
        broadcastNumbers.value = response.data

        const invalidSelectedNumber = newBroadcast.value.broadcastNumber && 
            !broadcastNumbers.value.includes(newBroadcast.value.broadcastNumber)

        if(invalidSelectedNumber) {
            newBroadcast.value.broadcastNumber = undefined
        }

        if(!newBroadcast.value.broadcastNumber && broadcastNumbers.value.length > 0) {
            newBroadcast.value.broadcastNumber = broadcastNumbers.value[0]
        }
    } catch(error) {
        console.log(error)
    } finally {
        loadingNumbers.value = false
    }
}

const onTemplateSelected = (template: TemplateItem) => {
    newBroadcast.value.template = template
    
    if(newBroadcast.value.broadcastNumber) {
        currentStep.value++
    }
}

fetchDataPage(1)
fetchBroadcastNumbers()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex justify-between py-2">
			<div class="flex items-center gap-2">
                <Button class="p-1!" variant="text" @click="router.push({ name: 'broadcasts' })" severity="secondary">
                    <IconArrowLeft size="22" />
                </Button>
                <div>
                    <h1 class="font-semibold text-xl">{{ $t('new_broadcast.select_template') }}</h1>
                    <div class="font-light">{{ $t('new_broadcast.select_template_subtitle') }}</div>
                </div>
            </div>

            <div class="flex flex-col justify-center">
                <div class="flex gap-2">
                    <div class="relative">
                        <IconSearch size="16" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <InputText
                            v-model="searchTerm"
                            class="pl-8! max-w-[180px] shadow-none!"
                            name="search"
                            id="search"
                            fluid
                            :placeholder="$t('search')"
                            @input="debouncedFetch()"
                        />
                    </div>

                    <Select 
                        id="broadcastNumbers" 
                        v-model="newBroadcast.broadcastNumber" 
                        :options="broadcastNumbers"
                        :option-label="(item: WABANumber) => `${item.verified_name} (${item.display_phone_number})`"
                        :placeholder="$t('broadcasts.select_number')"
                        :loading="loadingNumbers"
                        :disabled="loadingNumbers"
                    />

                    <Button 
                        @click="router.push({ 
                            name: 'new-template', 
                            query: { redirectTo: 'new-broadcast' }
                        })"
                    >
                        <IconPlus size="16" class="mr-1" />
                        <span>
                            {{ $t('new_broadcast.add_template') }}
                        </span>
                    </Button>
                </div>
            </div>
		</div>

        <div 
            v-if="dataPage.data.length === 0 && !loading"
            class="flex flex-col justify-center items-center py-30 gap-10"
        >
            <div class="text-3xl font-semibold text-center max-w-[500px] leading-10">
                {{ $t('new_broadcast.missing_template_title') }}
            </div>
            <div class="text-2xl font-medium text-gray-400 text-center max-w-[500px] leading-10">
                {{ $t('new_broadcast.missing_template_description') }}
            </div>
            <Button
                @click="router.push({ 
                    name: 'new-template', 
                    query: { redirectTo: 'new-broadcast' }
                })"
            >
                <span class="text">
                    {{ $t('new_broadcast.add_template') }}
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