<template>
  <div class="flex h-screen bg-slate-100">
    <TheSidebar />
    <RouterView v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <div class="px-5 pt-3 w-full">
          <component :is="Component" :key="route.path" />
        </div>
      </transition>
    </RouterView>
    <Toast position="bottom-right" />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { Toast } from 'primevue'
import TheSidebar from '../TheSidebar.vue'
</script>

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
