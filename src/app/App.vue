<script setup lang="ts">
import { onMounted, ref } from 'vue'

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
    <RouterView />
  </div>
</template>
