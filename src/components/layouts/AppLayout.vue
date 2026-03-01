<script lang="ts" setup>
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '~/stores/session'
import UnauthorizeAccess from '~/views/UnauthorizeAccess.vue'

const router = useRouter()
const route = useRoute()
const sessionStore = useSessionStore()

const hasAccess = computed(() => {
  const permissions = route.meta?.permissions as string[] | undefined
  if (!permissions || permissions.length === 0) return true

  return sessionStore.hasAnyPermission(permissions)
})

const endSession = () => {
  sessionStore.$reset()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen bg-slate-100">
    <AppSidebar />
    <RouterView v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <main class="w-full overflow-y-auto">
          <component :is="hasAccess ? Component : UnauthorizeAccess" :key="route.path" />
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
    <CompleteProfileDialog
      v-if="sessionStore.tenant && !sessionStore.tenant?.is_profile_completed"
      :visible="
        sessionStore.tenant &&
        !sessionStore.tenant?.is_profile_completed &&
        !sessionStore.createNumber
      "
    />
    <CreateNumberDialog
      v-if="sessionStore.tenant && !sessionStore.tenant?.is_profile_completed"
      :visible="
        sessionStore.tenant &&
        !sessionStore.tenant?.is_profile_completed &&
        sessionStore.createNumber
      "
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
