<script lang="ts" setup>
import { RouterView, useRouter } from 'vue-router'
import { useSessionStore } from '~/stores/session'

const router = useRouter()
const sessionStore = useSessionStore()

const endSession = () => {
	sessionStore.$reset()
	router.push('/login')
}
</script>

<template>
	<div class="flex h-screen bg-slate-100">
		<TheSidebar />
		<RouterView v-slot="{ Component, route }">
			<transition name="fade" mode="out-in">
				<main class="w-full overflow-y-auto">
					<component :is="Component" :key="route.path" />
				</main>
			</transition>
		</RouterView>
		<Toast position="bottom-right" />
		<WarningDialog
			v-model:visible="sessionStore.showOverrideDialog" 
			:title="$t('invalid_session')"
			:message="$t('session_override_message')"
			unclosable
            :confirmMessage="$t('accept')"
			@onConfirm="endSession" 
		/>
	</div>
</template>

<style lang="css">
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.17s;
}

.fade-enter,
.fade-leave-to {
	opacity: 0;
}
</style>
