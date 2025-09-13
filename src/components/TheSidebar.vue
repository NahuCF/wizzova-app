<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconSpeakerphone, IconLayout, IconUsers, IconAddressBook, 
	IconLogout, IconLoader2, IconForms, IconMessage } from '@tabler/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { API } from '~/services'
import { defineStore, getActivePinia } from 'pinia'

const router = useRouter()
const route = useRoute()

const loadingLogout = ref(false)
const isCollapsed = ref(false)

const resetAllStores = () => {
    const activepinia = getActivePinia()
    if (activepinia) {
		Object.entries(activepinia.state.value).forEach(([storeName, state]) => {
			const storeDefinition = defineStore(storeName, state)
			const store = storeDefinition(activepinia)
			store.$reset()
		})
	}
}

const logout = async () => {
	loadingLogout.value = true
	try {
		await API.auth.logout()
		resetAllStores()
		router.push('/login')
	} catch(error) {
		console.log(error)
	} 
	loadingLogout.value = false
}

const pages = computed(() => {
	return [
		{
			name: 'Broadcasts',
			icon: IconSpeakerphone,
			path: '/broadcasts',
			action: () => router.push('/broadcasts')
		},
		{
			name: 'Conversations',
			icon: IconMessage,
			path: '/conversations',
			hidden: true,
			action: () => router.push('/conversations')
		},
		{
			name: 'Templates',
			icon: IconLayout,
			path: '/templates',
			action: () => router.push('/templates')
		},
		{
			name: 'Contacts',
			icon: IconAddressBook,
			path: '/contacts',
			action: () => router.push('/contacts')
		},
		{
			name: 'Contact Fields',
			icon: IconForms,
			path: '/contact-fields',
			action: () => router.push('/contact-fields')
		},
		{
			name: 'Users, Teams and Roles',
			icon: IconUsers,
			path: '/settings/users-teams-roles',
			action: () => router.push('/settings/users-teams-roles')
		},
		{
			name: 'Logout',
			icon: loadingLogout.value ? IconLoader2 : IconLogout,
			iconClass: loadingLogout.value ? 'text-red-600 animate-spin' : 'text-red-600',
			class: 'text-red-600',
			action: logout
		}
	]
})

const parentRouteName = computed(() => {
	if (route.matched.length >= 2) {
		return route.matched[route.matched.length - 2].path
	}
	return null
})

const currentPage = computed(() => pages.value.find(page => page.path === parentRouteName.value))

watch(currentPage, (page) => {
	isCollapsed.value = !!page?.hidden
}, { immediate: true })
</script>

<template>
	<div
		class="shadow bg-white z-101 h-screen transition-all duration-300 ease-in-out"
		:class="isCollapsed ? 'w-[60px]' : 'w-[200px]'"
	>
		<ul class="list-none p-3 m-0 flex flex-col gap-1.5">
			<li 
				v-for="page in pages" 
				:key="page.name" 
				class="flex items-center py-1.5 px-3 hover:bg-slate-100 rounded-lg cursor-pointer" 
				:class="{
					'text-sky-600': parentRouteName === page.path,
					'bg-sky-100': parentRouteName === page.path,
					'gap-3': !isCollapsed
				}"
				@click="page.action"
			>
				<div>
					<component :is="page.icon" :key="page.name" :class="page.iconClass" />
				</div>
				<div
					v-if="!isCollapsed"
					:class="`text-base truncate ${page.class}`"
				>
					{{ page.name }}
				</div>
			</li>
		</ul>
	</div>
</template>
