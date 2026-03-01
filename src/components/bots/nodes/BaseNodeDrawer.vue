<script setup lang="ts">
import { IconLoader2, IconArrowLeft } from '@tabler/icons-vue'
import type { Component } from 'vue'

defineProps<{
  visible: boolean
  icon: Component
  title: string
  loading?: boolean
  disableSave?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'onSave'): void
}>()
</script>

<template>
  <Drawer
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    class="w-[560px]!"
    position="right"
  >
    <template #container="{ closeCallback }">
      <div class="flex items-center p-6 pb-0 gap-3">
        <IconArrowLeft class="text-slate-500 cursor-pointer" size="16" @click="closeCallback" />
        <div class="flex items-center gap-2">
          <component :is="icon" class="text-emerald-500" size="22" />
          <div class="text-xl font-medium">{{ title }}</div>
        </div>

        <a class="text-emerald-500 text-sm" href="https://www.google.com" target="_blank">
          {{ $t('learn_more') }}
        </a>
      </div>

      <Divider />

      <slot></slot>

      <div class="mt-auto p-6">
        <div class="flex justify-end gap-4">
          <Button
            class="bg-white! border-slate-200! hover:bg-slate-100!"
            severity="secondary"
            @click="emit('update:visible', false)"
          >
            {{ $t('cancel') }}
          </Button>
          <Button @click="emit('onSave')" :disabled="disableSave">
            <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
            <span v-else>{{ $t('save') }}</span>
          </Button>
        </div>
      </div>
    </template>
  </Drawer>
</template>
