<script setup lang="ts">
import { ref } from 'vue'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-vue'

const props = defineProps<{
  text: string
  defaultOpen?: boolean
}>()

const open = ref(props.defaultOpen || false)

const toggle = () => (open.value = !open.value)
</script>

<template>
  <div class="inline-block">
    <div
      class="inline-flex items-center gap-3 cursor-pointer rounded-md hover:bg-slate-100 transition"
      @click="toggle"
    >
      <span class="text-lg font-semibold truncate transition-opacity duration-300 ease-in-out">
        {{ text }}
      </span>
      <IconChevronDown
        v-if="!open"
        class="font-semibold transition-opacity duration-300 ease-in-out"
        size="16"
      />
      <IconChevronUp
        v-if="open"
        class="font-semibold transition-opacity duration-300 ease-in-out"
        size="16"
      />
    </div>

    <transition name="fade">
      <div v-show="open">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
