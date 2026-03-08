<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { IconCrown } from '@tabler/icons-vue'
import { useUserPreferencesStore } from '~/stores/userPreferences'
import { useFeatureAccess } from '~/composables/useFeatureAccess'
import type { MenuItem } from '~/types'

const props = defineProps<{
  item: MenuItem
  collapsed: boolean
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'onClick'): void
}>()

const router = useRouter()
const prefs = useUserPreferencesStore()
const { hasFeature, requireFeature } = useFeatureAccess()

const isFeatureLocked = computed(() => {
  return props.item.feature ? !hasFeature(props.item.feature) : false
})

const navigate = () => {
  if (isFeatureLocked.value) {
    requireFeature(props.item.feature!)
    return
  }

  if (props.item.path) router.push(props.item.path)
  if (props.item.collapse) prefs.setSidebarCollapsed(true)

  emit('onClick')
}
</script>

<template>
  <li
    class="flex items-center px-4 py-3 gap-3 rounded-md cursor-pointer hover:bg-slate-100 transition"
    :class="{
      'bg-emerald-100 text-emerald-600': active,
      'gap-3': !collapsed,
    }"
    @click="navigate"
  >
    <component :is="item.icon" class="font-extralight shrink-0" size="24" />
    <span
      class="ml-2 truncate transition-opacity duration-300 ease-in-out"
      :class="collapsed ? 'opacity-0' : 'opacity-100'"
    >
      {{ item.name }}
    </span>
    <IconCrown
      v-if="isFeatureLocked && !collapsed"
      class="ml-auto text-amber-400 shrink-0"
      size="16"
    />
  </li>
</template>
