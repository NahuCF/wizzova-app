<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'
import { defineProps } from 'vue'

defineProps<{
  name: string
  header?: string
  body: string
  footer?: string
  closable?: boolean
}>()

const emit = defineEmits<{
  (e: 'onClose'): void
}>()
</script>

<template>
  <div
    class="flex justify-between bg-slate-100 text-slate-700 rounded-md p-3 border-l-4 border-sky-400 break-words"
  >
    <div>
      <div class="text-sky-400 font-semibold pb-1">{{ name }}</div>

      <div v-if="header" class="font-semibold">{{ header }}</div>
      <div>{{ body }}</div>
      <div v-if="footer" class="italic text-slate-500 text-md">{{ footer }}</div>
    </div>

    <div v-if="closable">
      <IconX size="20" class="cursor-pointer" @click="emit('onClose')" />
    </div>
  </div>
</template>
