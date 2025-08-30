<script setup lang="ts">
import { IconAt } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useUserStore } from '~/stores'
import type { UserItem } from '~/types'

interface ConversationFilters {
	status?: 'OPEN' | 'RESOLVED'
	unread?: boolean
	assignedUser?: UserItem
}

const emit = defineEmits<{
	(e: 'applyFilters', filter: ConversationFilters): void
}>()

const userStore = useUserStore()

const popover = ref()
const filters = ref<ConversationFilters>({
	status: 'OPEN',
	unread: false
})

const resetFilters = () => {
	emit('applyFilters', {})
	popover.value?.hide()
	filters.value = {}
}

const applyFilters = () => {
	emit('applyFilters', filters.value)
	popover.value?.hide()
	filters.value = {}
}

defineExpose({
	show: (e: MouseEvent) => popover.value?.toggle(e),
})

userStore.fetchUsers()
</script>

<template>
	<Popover ref="popover" class="border rounded shadow w-sm">
		<div class="flex justify-between items-center gap-2 p-3">
			<span class="text-lg font-semibold">{{ $t('Filters') }}</span>
			<Button 
				variant="text"
				@click="resetFilters" 
			>
				{{ $t('Reset') }}
			</Button>
		</div>

		<Divider class="m-0! z-1" />

		<div class="flex flex-col p-3">
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<RadioButton
						v-model="filters.status"
						inputId="OPEN"
						value="OPEN"
					/>
					<label for="OPEN" class="text-lg font-normal cursor-pointer">
						{{ $t('Open chats') }}
					</label>
				</div>
				<div class="flex items-center gap-2">
					<RadioButton
						v-model="filters.status"
						inputId="RESOLVED"
						value="RESOLVED"
					/>
					<label for="RESOLVED" class="text-lg font-normal cursor-pointer">
						{{ $t('Resolved chats') }}
					</label>
				</div>
			</div>

			<Divider type="solid" />

			<div class="flex items-center gap-2">
				<Checkbox v-model="filters.unread" inputId="unreadChats" name="unreadChats" :value="true" />
				<label for="unreadChats" class="text-lg font-normal cursor-pointer"> 
					{{ $t('Unread chats') }} 
				</label>
			</div>

			<Divider type="solid" />

			<div class="flex flex-col gap-2">
				<label class="flex items-center gap-2 text-lg font-normal">
					<IconAt size="16" />
					{{ $t('Assigned to') }}
				</label>
				<Select
					v-model="filters.assignedUser" 
					class="flex-1"
					:options="userStore.users" 
					:placeholder="$t('Select user')"
					optionLabel="name"
				/>
			</div>
		</div>

		<div class="flex flex-col gap-2 p-3">
			<div class="flex justify-end gap-2">
				<Button :label="$t('cancel')" text @click="popover?.hide()" />
				<Button :label="$t('apply')" @click="applyFilters" />
			</div>
		</div>
	</Popover>
</template>