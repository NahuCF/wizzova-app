<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconSpeakerphone, IconLayout, IconUsers, IconAddressBook, 
	IconLogout, IconLoader2, IconForms, IconMessage } from '@tabler/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { API } from '~/services'
import { defineStore, getActivePinia } from 'pinia'

const router = useRouter()
const route = useRoute()

const loadingLogout = ref(false)

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
</script>

<template>
	<div class="w-[200px] shadow bg-white z-101">
		<ul class="list-none p-0 m-0 flex flex-col">
			<li 
				v-for="page in pages" 
				:key="page.name" 
				class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-100 cursor-pointer" 
				:class="{
					'text-sky-600': parentRouteName === page.path,
					'bg-sky-100': parentRouteName === page.path,
				}"
				@click="page.action"
			>
				<component :is="page.icon" :key="page.name" :class="page.iconClass" />
				<div :class="`text-base ${page.class}`">{{ page.name }}</div>
			</li>
		</ul>
	</div>
</template>
