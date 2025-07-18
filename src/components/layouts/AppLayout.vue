<script lang="ts" setup>
import { RouterView } from 'vue-router'
</script>


<template>
  <div class="flex h-screen bg-slate-100">
    <TheSidebar />
    <RouterView v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <main class="w-full overflow-y-scroll">
          <component :is="Component" :key="route.path" />
        </main>
      </transition>
    </RouterView>
    <Toast position="bottom-right" />
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
