<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconSpeakerphone, IconLayout, IconUsers, IconAddressBook } from '@tabler/icons-vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const pages = ref([
	{
		name: 'Campaigns',
		icon: IconSpeakerphone,
		path: '/campaigns'
	},
	{
		name: 'Templates',
		icon: IconLayout,
		path: '/templates'
	},
	{
		name: 'Contacts',
		icon: IconUsers,
		path: '/contacts'
	},
	{
		name: 'Contact Fields',
		icon: IconAddressBook,
		path: '/contact-fields'
	}
])

const parentRouteName = computed(() => {
  if (route.matched.length >= 2) {
    return route.matched[route.matched.length - 2].path
  }
  return null
})
</script>

<template>
	<div class="w-[13rem] shadow bg-white z-101">
		<ul class="list-none p-0 m-0 flex flex-col">
			<li 
				v-for="page in pages" 
				:key="page.name" 
				class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-100 cursor-pointer" 
				:class="{
					'text-sky-600': parentRouteName === page.path,
					'bg-sky-100': parentRouteName === page.path
				}"
				@click="() => router.push(page.path)"
			>
				<component :is="page.icon" :key="page.name" />
				<div class="text-sm">{{ page.name }}</div>
			</li>
		</ul>
	</div>
</template>
