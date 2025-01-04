<template>
  <div>
    <div class="flex flex-col gap-3 border rounded-lg bg-white p-8 shadow-sm w-[32rem]">123</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useProfileCreationStore } from '~/stores/profileCreation'

const profileCreation = useProfileCreationStore()

onMounted(() => {
  profileCreation.incrementProgress(3)
})
</script>
