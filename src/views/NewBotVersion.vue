<script setup lang="ts">
import { IconArrowLeft, IconPencil } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API } from '~/services'
import type { BotItem } from '~/types'

const route = useRoute()
const router = useRouter()

const bot = ref<BotItem>()
const name = ref('')

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
</script>

<template>
	<div class="flex flex-col h-[100vh]">
		<div class="flex justify-between p-4 bg-white shadow z-1">
			<div class="flex items-center gap-1">
				<Button variant="text" @click="router.push({ name: 'bots' })" class="p-1!" severity="secondary">
					<IconArrowLeft size="22" />
				</Button>
				<div class="text-lg text-slate-500 pl-2">
					{{ name || $t('new_botflow.no_name') }}
				</div>
				<Button variant="text" @click="router.push({ name: 'bots' })" class="p-1!" severity="secondary">
					<IconPencil size="18" />
				</Button>
			</div>
		</div>
		<BotWorkflow />
	</div>
</template>