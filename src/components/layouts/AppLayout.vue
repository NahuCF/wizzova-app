<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { RouterView } from 'vue-router'

const isMounting = ref(true)

onMounted(async () => {
  const minDelay = new Promise(resolve => setTimeout(resolve, 500))
  const renderReady = new Promise(requestAnimationFrame)

  await Promise.all([minDelay, renderReady])
  isMounting.value = false
})
</script>


<template>
  <div>
    <div v-if="isMounting" class="fixed inset-0 bg-white flex items-center justify-center z-150">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="5" />
    </div>

    <div class="flex h-screen bg-slate-100">
      <TheSidebar />
      <RouterView v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <main class="px-5 w-full overflow-y-scroll">
            <component :is="Component" :key="route.path" />
          </main>
        </transition>
      </RouterView>
      <Toast position="bottom-right" />
    </div>
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
