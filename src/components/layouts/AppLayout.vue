<template>
  <div class="flex h-screen bg-slate-100">
    123
    <RouterView v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
    <Toast position="bottom-right" />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { Toast } from 'primevue'
</script>

<style lang="css">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.7s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
