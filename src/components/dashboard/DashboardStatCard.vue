<script setup lang="ts">
import { IconInfoCircle } from '@tabler/icons-vue'

defineProps<{
  label: string
  count: number
  tooltip: string
  loading?: boolean
}>()
</script>

<template>
  <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-3">
    <div class="flex justify-between items-center">
      <div class="font-normal text-gray-500">
        <span v-if="!loading">{{ label }}</span>
        <div v-else class="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <IconInfoCircle
        v-if="!loading"
        v-tooltip.top="tooltip"
        class="w-[16px] h-[16px] text-gray-400 cursor-help"
      />
    </div>

    <div class="text-xl font-bold">
      <span v-if="!loading">{{ count }}</span>
      <div v-else class="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
    </div>
  </div>
</template>
