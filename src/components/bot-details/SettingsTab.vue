<script setup lang="ts">
import { IconAsterisk } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import type { BotConfiguration } from '~/types'

const props = defineProps<{
	botId?: string
}>()

const handleError = useErrorHandler()

const conf = ref<BotConfiguration>({
	name: '',
	wait_time_minutes: 0,
	timeout_action: 'message',
	no_match_action: 'no_action',
	end_conversation_action: 'no_action',
	about_to_end_action: 'no_action'
})

const saveConfiguration = async () => {
	if(!props.botId) return

	try {
		const { data: response } = await API.bot.configuration(props.botId, conf.value)
	} catch(error) {
		handleError(error)
	}
}

</script>

<template>
	<div class="flex flex-col gap-8 px-30 pb-6">
		<div class="flex flex-col gap-1 relative">
			<div class="flex gap-1">
				<label for="name" class="text-lg">{{ $t('bots.create_form.name') }}</label>
				<IconAsterisk color="red" class="mt-1" size="8" />
			</div>
			<div class="relative">
				<InputText 
					v-model="conf.name" 
					class="!pr-[5.5rem]" 
					name="name" 
					id="name"
					fluid 
					:maxlength="512" 
					:placeholder="$t('bots.create_form.name_placeholder')"
				/>
			</div>
		</div>

		<div>
			<Collapsable :text="$t('bot_details.if_client_doesnt_answer')" defaultOpen>
				<div class="pt-3">
					todo
				</div>
			</Collapsable>
		</div>

		<div>
			<Collapsable :text="$t('bot_details.if_session_is_ending')">
				<div class="pt-3">
					todo
				</div>
			</Collapsable>
		</div>

		<div>
			<Collapsable :text="$t('bot_details.if_session_ends')">
				<div class="pt-3">
					todo
				</div>
			</Collapsable>
		</div>

		<div>
			<Collapsable :text="$t('bot_details.if_no_match')">
				<div class="pt-3">
					todo
				</div>
			</Collapsable>
		</div>

		<div>
			<Collapsable :text="$t('bot_details.if_no_more_nodes')">
				<div class="pt-3">
					todo
				</div>
			</Collapsable>
		</div>

		<div class="flex justify-end">
			<div>
				<Button @click="saveConfiguration" :disabled="!conf.name">
					<span>
						{{ $t(`save`) }}
					</span>
				</Button>
			</div>
		</div>
	</div>
</template>