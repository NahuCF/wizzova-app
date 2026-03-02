<template>
  <div class="flex h-screen bg-slate-100">
    <RouterView v-slot="{ Component, route }">
      <transition name="fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
    <Toast position="bottom-center" />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
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
