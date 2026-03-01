<script setup lang="ts" generic="T">
import { computed, ref } from 'vue'
import type { ActionGenerator, ActionItem } from '~/types'

const props = defineProps<{
  actions?: ActionGenerator<T>
}>()

const popoverRef = ref()
const selectedItem = ref<T | null>(null)

const show = (event: MouseEvent, item?: T) => {
  selectedItem.value = item
  popoverRef.value?.toggle(event)
}

const select = async (option: ActionItem) => {
  await option.action()
  popoverRef.value?.hide()
}

const actionGroups = computed(() => {
  if (props.actions) {
    return props.actions(selectedItem.value)
  }

  return []
})

defineExpose({ show })
</script>

<template>
  <Popover ref="popoverRef" class="min-w-[15rem]">
    <div class="pt-3 pb-2">
      <ul class="list-none p-0 m-0 flex flex-col">
        <template v-for="(actionGroup, index) in actionGroups" :key="index">
          <li
            v-for="action in actionGroup"
            :key="action.label"
            class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-100"
            :class="[
              action.class ?? '',
              action.disabled ? 'opacity-50 hover:bg-transparent cursor-default' : 'cursor-pointer',
            ]"
            @click="!action.disabled && select(action)"
            v-tooltip.bottom="
              action.tooltip && {
                value: action.tooltip,
                class: 'text-base max-w-[300px]!',
              }
            "
          >
            <component :is="action.icon" class="w-[16px] h-[16px]" :class="action.iconClass" />
            {{ action.label }}
          </li>
          <Divider v-if="index !== actionGroups.length - 1" class="my-2.5!" />
        </template>
      </ul>
    </div>
  </Popover>
</template>
