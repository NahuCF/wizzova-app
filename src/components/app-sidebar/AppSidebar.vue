<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconSpeakerphone, IconLayout, IconUsers, IconAddressBook, 
	IconLogout, IconLoader2, IconForms, IconMessage, 
	IconSettings2,
	IconUser,
	IconCrown} from '@tabler/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { API } from '~/services'
import { defineStore, getActivePinia, storeToRefs } from 'pinia'
import type { MenuItem } from '~/types'
import { useSessionStore } from '~/stores'
import { useUserPreferencesStore } from '~/stores/userPreferences'
import { usePopoverPosition } from '~/composables/usePopoverPosition'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const session = useSessionStore()
const prefs = useUserPreferencesStore()
const { sidebarCollapsed: collapsed } = storeToRefs(prefs)

const router = useRouter()
const route = useRoute()

const loadingLogout = ref(false)
const popover = ref()
const { positionPopover } = usePopoverPosition(popover)
const sidebarMenu: MenuItem[] = [
	{
		name: t('app_sidebar.routes.broadcasts'),
		path: '/broadcasts',
		icon: IconSpeakerphone,
		permission: 'campaigns.view_and_manage_campaigns'
	},
	{
		name: t('app_sidebar.routes.conversations'),
		path: '/conversations',
		icon: IconMessage,
		permission: 'conversations.view_and_manage_conversations',
		collapse: true
	},
	{
		name: t('app_sidebar.routes.contacts'),
		path: '/contacts',
		icon: IconAddressBook,
		permission: 'contact.view_and_manage_contact'
	},
	{
		name: t('app_sidebar.routes.settings'),
		icon: IconSettings2,
		children: [
			{
				name: t('app_sidebar.routes.templates'),
				path: '/settings/templates',
				icon: IconLayout,
				permission: 'settings.view_and_manage_templates'
			},
			{
				name: t('app_sidebar.routes.contact_fields'),
				path: '/settings/contact-fields',
				icon: IconForms,
				permission: 'settings.view_and_manage_contact_fields'
			},
			{
				name: t('app_sidebar.routes.users_teams_roles'),
				path: '/settings/users-teams-roles',
				icon: IconUsers,
				permission: 'settings.view_user_roles_and_teams'
			}
		]
	}
]

const hasPermission = (item: MenuItem) => {
  	return item.permission ? session.hasPermission(item.permission) : true
}

const isActive = (path?: string) => {
  	return path ? route.path.startsWith(path) : false
}

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
</script>

<template>
	<aside
		class="flex flex-col w-full bg-white shadow h-screen border-r border-slate-200 transition-all duration-300 ease-in-out"
		:class="collapsed ? 'max-w-[60px]' : 'max-w-[220px]'"
	>
		<div
			class="flex items-center justify-between p-6 border-b border-slate-200 cursor-pointer"
			@click="prefs.toggleSidebar()"
		>
			<div v-if="!collapsed" class="flex items-center space-x-3">
				<img src="/favicon.ico" class="w-8 h-8 shrink-0" />
				<span class="font-semibold text-xl">Wabox</span>
			</div>
			<div v-else>
				<img src="/favicon.ico" class="w-8 h-8 shrink-0o" />
			</div>
		</div>

		<ul class="flex-1 overflow-y-auto px-2 py-4 space-y-2">
			<template v-for="item in sidebarMenu" :key="item.name">
				<SidebarGroup
					v-if="item.children && hasPermission(item)"
					:item="item"
					:collapsed="collapsed"
					:hasPermission="hasPermission"
					:isActive="isActive"
				/>
				<SidebarItem
					v-else-if="hasPermission(item)"
					:item="item"
					:collapsed="collapsed"
					:active="isActive(item.path)"
				/>
			</template>
		</ul>

		<div class="border-t border-slate-200 p-3">
			<div
				class="flex items-center gap-3 px-4 py-3 rounded-md cursor-pointer hover:bg-slate-100 transition"
				@click="popover.toggle"
			>
				<div>
					<Avatar 
						:label="session.user?.name.charAt(0).toLocaleUpperCase()"
						size="large"
						shape="circle"
					/>
				</div>
				<div v-if="!collapsed" class="flex flex-col justify-between">
					<span class="text truncate">{{ session.user?.name }}</span>
					<span class="text-sm text-slate-500 truncate">{{ session.user?.email }}</span>
				</div>
			</div>
		</div>

		<Popover
			ref="popover"
			unstyled
			class="bg-white rounded-md shadow-md ml-6"
			@show="positionPopover({ alignVertical: 'bottom' })"
		>
			<div class="flex flex-col">
				<div class="flex items-center gap-3 p-4 min-w-[200px]">
					<div>
						<Avatar 
							:label="session.user?.name.charAt(0).toLocaleUpperCase()"
							size="large"
							shape="circle"
						/>
					</div>
					<div class="flex flex-col justify-between">
						<span class="text truncate">{{ session.user?.name }}</span>
						<span class="text-sm text-slate-500 truncate">{{ session.user?.email }}</span>
					</div>
				</div>

				<div
					class="flex items-center p-4 cursor-pointer hover:bg-slate-100 transition"
					@click="router.push('/profile')"
				>
					<IconUser
						class="mr-2 shrink-0"
						size="20"
					/>
					<span class="truncate">{{ $t('app_sidebar.routes.profile') }}</span>
				</div>

				<div
					class="flex items-center p-4 cursor-pointer hover:bg-slate-100 transition"
					@click="router.push('/subscription')"
				>
					<IconCrown
						class="mr-2 shrink-0"
						size="20"
					/>
					<span class="truncate">{{ $t('app_sidebar.routes.subscription') }}</span>
				</div>

				<div
					class="flex items-center p-4 cursor-pointer hover:bg-slate-100 text-red-600 transition"
					@click="logout"
				>
					<component
						:is="loadingLogout ? IconLoader2 : IconLogout"
						class="mr-2 shrink-0"
						:class="{ 'animate-spin': loadingLogout }"
						size="20"
					/>
					<span class="truncate">{{ $t('app_sidebar.logout') }}</span>
				</div>
			</div>
        </Popover>
	</aside>
</template>
