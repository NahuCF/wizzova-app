<template>
  <div class="flex h-screen justify-center items-center bg-slate-100">
    <div>
      <ProgressBar
        class="!rounded-b-none !h-2"
        :value="profileCreation.progress"
        :showValue="false"
      />
      <RouterView />
    </div>
    <Toast position="bottom-right" />
  </div>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router'
import { Toast } from 'primevue'
import ProgressBar from 'primevue/progressbar'
import { useProfileCreationStore } from '~/stores/profileCreation'

const profileCreation = useProfileCreationStore()
</script>
