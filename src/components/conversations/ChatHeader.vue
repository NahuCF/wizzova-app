<script setup lang="ts">
import { IconInfoCircle, IconLoader2, IconReload, IconSearch, IconCheck } from '@tabler/icons-vue'
import { computed } from 'vue'
import { useContactUtils } from '~/composables/useContactUtils'
import { useUserStore } from '~/stores'
import type { ConversationItem, UserItem } from '~/types'

defineProps<{
	conversation: ConversationItem,
	changingSolved?: boolean,
	changingOwner?: boolean
}>()

const emit = defineEmits<{
	(e: 'onSolved', value: boolean): void,
	(e: 'onChangeOwner', value?: UserItem): void,
	(e: 'onSearch'): void
}>()

const userStore = useUserStore()
const { getContactName, getContactPhone } = useContactUtils()

const users = computed(() => [
	userStore.notAssigned,
	...userStore.users
])

const onChangeOwner = (value: string) =>  {
	const owner = users.value.find(u => u.id === value)
	emit('onChangeOwner', owner)
}
</script>

<template>
	<div class="flex justify-between p-4 bg-white shadow z-1">
		<div class="flex flex-col gap-2">
			<div class="flex gap-2">
				<h2 class="text-base">
					{{ getContactName(conversation.contact) }}
				</h2>
				<div v-tooltip.bottom="{
					value: getContactPhone(conversation.contact),
					class: 'max-w-[250px]!'
				}">
					<IconInfoCircle class="text-gray-400 hover:cursor-pointer" size="16" />
				</div>
			</div>

			<div
				v-tooltip.top="{
					value: conversation.phone_number.display_phone_number,
					class: 'text-base max-w-[300px]!'
				}"
			>
				{{ conversation.phone_number.verified_name }}
			</div>
		</div>

		<div v-if="conversation.is_initiated" class="flex items-center gap-2">
			<div v-if="!conversation.is_solved && !conversation.is_expired">
				<Button
					severity="secondary"
					:disabled="changingSolved"
					@click="emit('onSolved', true)"
				>
					<IconLoader2 v-if="changingSolved" class="animate-spin w-6 h-6" />
					<div v-else class="flex items-center gap-2">
						<IconCheck size="16" />
						<div>{{ $t('conversations.solve') }}</div>
					</div>
				</Button>
			</div>
			<div v-if="conversation.is_solved && !conversation.is_expired">
				<Button
					severity="secondary"
					:disabled="changingSolved"
					@click="emit('onSolved', false)"
				>
					<IconLoader2 v-if="changingSolved" class="animate-spin w-6 h-6" />
					<div v-else class="flex items-center gap-2">
						<IconReload size="16" />
						<div>{{ $t('conversations.reopen') }}</div>
					</div>
				</Button>
			</div>

			<div>
				<Select
					:modelValue="conversation.assigned_user?.id"
					@change="onChangeOwner($event.value)"
					:options="users"
					optionValue="id"
					optionLabel="name"
					:placeholder="$t('conversations.assign_to')"
					:disabled="conversation.is_solved || conversation.is_expired || changingOwner"
					:loading="changingOwner"
					class="w-full min-w-[200px]" 
				/>
			</div>

			<Button
				severity="secondary"
				variant="text"
				class="min-w-[32px]! h-[32px]!"
				@click="emit('onSearch')"
			>
				<div>
					<IconSearch size="18" />
				</div>
			</Button>
		</div>
	</div>
</template>