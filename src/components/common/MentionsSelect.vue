<script setup lang="ts">
import type { UserItem } from '~/types'
import type { ListboxChangeEvent } from 'primevue/listbox'
import Listbox from 'primevue/listbox'

defineProps<{
	options: UserItem[]
	show: boolean
}>()

const emit = defineEmits<{
	(e: 'select', user: UserItem): void
}>()

const onSelect = (event: ListboxChangeEvent) => {
	emit('select', event.value)
}
</script>

<template>
	<div
		v-if="show && options.length"
		class="absolute z-10 w-full max-h-64 overflow-auto bottom-full mb-2"
	>
		<Listbox
			:options="options"
			option-label="name"
			@change="onSelect"
		/>
	</div>
</template>