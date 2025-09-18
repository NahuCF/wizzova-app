<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
	items: Array<{ id: string, label: string }>
	command: (item: { id: string; label: string }) => void
}>()
const selectedIndex = ref(0)

const upHandler = () => {
	selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length
}

const downHandler = () => {
	selectedIndex.value = (selectedIndex.value + 1) % props.items.length
}

const enterHandler = () => {
	selectItem(selectedIndex.value)
}

const selectItem = (index: number) => {
	const item = props.items[index]
	if (item) props.command({
		id: item.id,
		label: item.label
	})
}

const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
	if (event.key === 'ArrowUp') {
		upHandler()
		return true
	}
	if (event.key === 'ArrowDown') {
		downHandler()
		return true
	}
	if (event.key === 'Enter') {
		enterHandler()
		return true
	}
	return false
}

watch(() => props.items, () => (selectedIndex.value = 0))

defineExpose({ onKeyDown })
</script>

<template>
	<Listbox v-show="items.length" :modelValue="items[selectedIndex]" :options="items" class="p-1">
		<template #option="{ option }: { option: { id: string, label: string }}">
			<a
				v-ripple
				class="flex items-center min-w-[200px] rounded cursor-pointer"
				@click="selectItem(items.findIndex(i => i.id === option.id))"
			>
				<div class="flex items-center gap-2">
					<Avatar
						v-if="option.label"
						:label="option.label.charAt(0).toLocaleUpperCase()"
						shape="circle"
						size="small"
					/>
					{{ option.label }}
				</div>
			</a>
		</template>
	</Listbox>
</template>

<style scoped>
.dropdown-menu {
	background: white;
	border: 1px solid #ccc;
	border-radius: 0.5rem;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
	display: flex;
	flex-direction: column;
	gap: 0.1rem;
	overflow: auto;
	padding: 0.25rem 0;
	position: relative;
	min-width: 120px;
}

button {
	background: transparent;
	text-align: left;
	width: 100%;
	padding: 0.25rem 0.5rem;
	cursor: pointer;
}

button:hover,
button.is-selected {
	background-color: #e0f2fe;
}
</style>
