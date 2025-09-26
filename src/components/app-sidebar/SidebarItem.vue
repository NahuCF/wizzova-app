<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserPreferencesStore } from '~/stores/userPreferences'
import type { MenuItem } from '~/types'

const props = defineProps<{
	item: MenuItem
	collapsed: boolean
	active: boolean
}>()

const emit = defineEmits<{
	(e: 'onClick'): void
}>()

const router = useRouter()
const prefs = useUserPreferencesStore()

const navigate = () => {
	if (props.item.path) router.push(props.item.path)
	if (props.item.collapse) prefs.setSidebarCollapsed(true)

	emit('onClick')
}
</script>

<template>
	<li
		class="flex items-center px-4 py-3 rounded-md cursor-pointer hover:bg-slate-100 transition"
		:class="{
			'bg-emerald-100 text-emerald-600': active,
			'gap-3': !collapsed
		}"
		@click="navigate"
	>
		<component :is="item.icon" class="font-extralight shrink-0" size="20" />
		<span v-if="!collapsed" class="truncate ml-2">
			{{ item.name }}
		</span>
	</li>
</template>
