<script setup lang="ts">
import { IconAt } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useUserStore } from '~/stores'
import type { ConversationFilters } from '~/types'

const emit = defineEmits<{
  (e: 'onApply', filter: ConversationFilters): void
  (e: 'onReset'): void
}>()

const userStore = useUserStore()

const popover = ref()
const filters = ref<ConversationFilters>({
  status: 'opened',
  unread: false,
})

const resetFilters = () => {
  popover.value?.hide()
  filters.value = {
    status: 'opened',
    unread: false,
  }
}

const applyFilters = () => {
  emit('onApply', filters.value)
  popover.value?.hide()
}

defineExpose({
  show: (e: MouseEvent) => popover.value?.toggle(e),
  reset: resetFilters,
})

userStore.fetchUsers()
</script>

<template>
  <Popover ref="popover" class="border rounded shadow w-sm">
    <div class="flex justify-between items-center gap-2 p-3">
      <span class="text-lg font-semibold">{{ $t('conversations.filters.title') }}</span>
      <Button variant="text" @click="emit('onReset')">
        {{ $t('reset') }}
      </Button>
    </div>

    <Divider class="m-0! z-1" />

    <div class="flex flex-col p-3">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <RadioButton v-model="filters.status" inputId="opened" value="opened" />
          <label for="opened" class="text-lg font-normal cursor-pointer">
            {{ $t('conversations.filters.open_chats') }}
          </label>
        </div>
        <div class="flex items-center gap-2">
          <RadioButton v-model="filters.status" inputId="resolved" value="resolved" />
          <label for="resolved" class="text-lg font-normal cursor-pointer">
            {{ $t('conversations.filters.resolved_chats') }}
          </label>
        </div>
      </div>

      <Divider type="solid" />

      <div class="flex items-center gap-2">
        <Checkbox v-model="filters.unread" inputId="unreadChats" name="unreadChats" binary />
        <label for="unreadChats" class="text-lg font-normal cursor-pointer">
          {{ $t('conversations.filters.unread_chats') }}
        </label>
      </div>

      <Divider type="solid" />

      <div class="flex flex-col gap-2">
        <label class="flex items-center gap-2 text-lg font-normal">
          <IconAt size="16" />
          {{ $t('conversations.filters.assigned_to') }}
        </label>
        <Select
          v-model="filters.assignedUser"
          class="flex-1"
          :options="userStore.users"
          :placeholder="$t('conversations.filters.select_user')"
          optionLabel="name"
        />
      </div>
    </div>

    <div class="flex flex-col gap-2 p-3">
      <div class="flex justify-end gap-2">
        <Button :label="$t('cancel')" text @click="popover?.hide()" />
        <Button :label="$t('apply')" @click="applyFilters" />
      </div>
    </div>
  </Popover>
</template>
