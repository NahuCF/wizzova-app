<script setup lang="ts">
import { IconPlus, IconArrowLeft } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsTab from '~/components/bot-details/SettingsTab.vue'
import StatsTab from '~/components/bot-details/StatsTab.vue'
import VersionTab from '~/components/bot-details/VersionTab.vue'
import { API } from '~/services'
import type { BotItem } from '~/types'

const route = useRoute()
const router = useRouter()

const tabs = ref(['stats', 'versions', 'settings'])
const currentTab = ref('stats')
const bot = ref<BotItem>()

const loadBot = async () => {
	const botId = route.params.id

	if(typeof botId === 'string') {
		try {
			const { data: response } = await API.bot.get(botId)
			bot.value = response.data
		} catch(error) {
			console.log(error)
		}
	}
}

loadBot()

if(typeof route.query.tab === 'string') {
	currentTab.value = route.query.tab
}
</script>

<template>
    <div class="flex flex-col h-full">
        <div class="flex justify-between items-center px-6 pt-6">
			<div class="flex items-center gap-3">
				<Button variant="text" @click="router.back()" class="p-1!" severity="secondary">
					<IconArrowLeft size="20" />
				</Button>
				<div class="text-2xl font-semibold">{{ bot?.name }}</div>
			</div>
			<div>
				<Button @click="router.push({ name: 'new-botflow', params: { id: bot?.id || '' } })">
					<IconPlus size="16" class="mr-1" />
					<span>
						{{ $t(`bot_details.add_a_version`) }}
					</span>
				</Button>
			</div>
		</div>
        <Tabs v-model:value="currentTab" class="py-4" lazy>
            <TabList class="text-lg">
                <Tab v-for="tab in tabs" :key="tab" :value="tab">
                    <div class="flex items-center gap-2 text-inherit">
                        <span>{{ $t(`bot_details.tabs.${tab}`) }}</span>
                    </div>
                </Tab>
            </TabList>
            <TabPanels class="px-6! py-8!">
                <TabPanel value="stats">
					<StatsTab :botId="bot?.id" />
                </TabPanel>
				<TabPanel value="versions">
					<VersionTab :botId="bot?.id" />
                </TabPanel>
				<TabPanel value="settings">
					<SettingsTab :botId="bot?.id" />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>