<template>
  <div class="flex h-screen bg-slate-100">
    <RouterView />
    <Toast position="bottom-right" />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { Toast } from 'primevue'
</script>
