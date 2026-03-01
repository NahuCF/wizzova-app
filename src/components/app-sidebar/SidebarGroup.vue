<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-vue'
import type { MenuItem } from '~/types'
import { usePopoverPosition } from '~/composables/usePopoverPosition'

const props = defineProps<{
  item: MenuItem
  collapsed: boolean
  hasPermission: (item: MenuItem) => boolean
  isActive: (path?: string) => boolean
}>()

const open = ref(false)
const popover = ref()
const { positionPopover } = usePopoverPosition(popover)
const groupButton = ref()

const allowedChildren = computed(
  () => props.item.children?.filter((c) => props.hasPermission(c)) || [],
)

const toggle = (event: Event) => {
  if (props.collapsed) {
    popover.value?.toggle(event)
  } else {
    open.value = !open.value
  }
}
</script>

<template>
  <li>
    <div
      ref="groupButton"
      class="flex items-center px-4 py-3 cursor-pointer rounded-md hover:bg-slate-100 transition"
      @click="toggle"
    >
      <component :is="item.icon" class="shrink-0" size="24" />
      <span
        class="flex-1 ml-5 truncate transition-opacity duration-300 ease-in-out"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
      >
        {{ item.name }}
      </span>
      <IconChevronDown
        v-if="!open"
        class="transition-opacity duration-300 ease-in-out"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        size="12"
      />
      <IconChevronUp
        v-if="open"
        class="transition-opacity duration-300 ease-in-out"
        :class="collapsed ? 'opacity-0' : 'opacity-100'"
        size="12"
      />
    </div>

    <transition name="fade">
      <ul v-if="open && !collapsed" class="pl-8 mt-2 space-y-2">
        <SidebarItem
          v-for="child in allowedChildren"
          :key="child.name"
          :item="child"
          :collapsed="collapsed"
          :active="isActive(child.path)"
        />
      </ul>
    </transition>

    <Popover
      ref="popover"
      unstyled
      class="bg-white rounded-md shadow-sm ml-4"
      @show="positionPopover()"
    >
      <div class="flex items-center px-4 py-3 w-[200px]">
        <span class="flex-1 ml-1 text-slate-500 truncate">{{ item.name }}</span>
      </div>
      <ul class="mt-2 space-y-2">
        <SidebarItem
          v-for="child in allowedChildren"
          :key="child.name"
          :item="{
            ...child,
            icon: undefined,
          }"
          :collapsed="false"
          :active="isActive(child.path)"
          @onClick="popover.toggle($event)"
        />
      </ul>
    </Popover>
  </li>
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
