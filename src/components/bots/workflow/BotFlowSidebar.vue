<script setup lang="ts">
import { IconCrown, IconSearch } from '@tabler/icons-vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  nodeItems,
  type BotNodeCategory,
  type BotNodeItem,
} from '~/composables/workflow/useFlowDragAndDrop'
import { useSessionStore } from '~/stores'
import { useFeatureAccess } from '~/composables/useFeatureAccess'

const emit = defineEmits<{
  (
    e: 'dragStart',
    {
      event,
      nodeItem,
    }: {
      event: DragEvent
      nodeItem: BotNodeItem
    },
  ): any
  (e: 'addNode', nodeItem: BotNodeItem): void
}>()

const { t } = useI18n()
const sessionStore = useSessionStore()
const { requireFeature } = useFeatureAccess()

const searchTerm = ref('')

const groupedItems = computed(() => {
  const term = searchTerm.value.toLowerCase()

  const filtered = term
    ? nodeItems.filter((item) => {
        const translatedName = t(`bot_workflow.nodes.${item.name}`).toLowerCase()
        return translatedName.includes(term)
      })
    : nodeItems

  const groups: Record<BotNodeCategory, BotNodeItem[]> = {} as Record<
    BotNodeCategory,
    BotNodeItem[]
  >

  for (const item of filtered) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }

  return groups
})

const onClick = (nodeItem: BotNodeItem) => {
  if (nodeItem.isPremium && !sessionStore.hasPremiumAccess) {
    requireFeature('advanced_chatbot')
  } else {
    emit('addNode', nodeItem)
  }
}

const onDragStart = (event: DragEvent, nodeItem: BotNodeItem) => {
  if (nodeItem.isPremium && !sessionStore.hasPremiumAccess) {
    event.preventDefault()
    return
  }
  emit('dragStart', { event, nodeItem })
}
</script>

<template>
  <aside class="max-w-[400px] w-full bg-white p-6 flex flex-col gap-4">
    <div class="relative">
      <IconSearch
        size="14"
        class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
      />
      <InputText
        v-model="searchTerm"
        class="pl-8! w-full shadow-none!"
        name="search"
        id="search"
        fluid
        :placeholder="$t('search')"
      />
    </div>

    <div v-for="(items, category) in groupedItems" :key="category" class="flex flex-col gap-4">
      <div class="text-lg text-slate-700 uppercase">
        {{ $t(`bot_workflow.categories.${category}`) }}
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="nodeItem in items"
          :key="nodeItem.name"
          class="relative flex flex-col gap-2 items-center justify-around border-2 rounded-lg py-4 px-2 cursor-pointer"
          :class="{
            'border-slate-100': !nodeItem.isPremium,
            'border-amber-300': nodeItem.isPremium,
          }"
          :draggable="!nodeItem.isPremium || sessionStore.hasPremiumAccess"
          @dragstart="onDragStart($event, nodeItem)"
          @click="onClick(nodeItem)"
        >
          <component class="text-emerald-500" :is="nodeItem.icon" size="32" />
          <IconCrown
            v-if="nodeItem.isPremium"
            class="absolute top-0 right-1 text-amber-300"
            size="18"
          />
          <div class="text-slate-500 text-center">
            {{ $t(`bot_workflow.nodes.${nodeItem.name}`) }}
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
