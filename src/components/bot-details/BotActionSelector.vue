<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUserStore, useBotStore } from '~/stores'
import type { BotAction } from '~/types'

const props = defineProps<{
  prefix: string
  conf: Record<string, any>
  actions: BotAction[]
}>()

const userStore = useUserStore()
const botStore = useBotStore()

const actionKey = computed(() => `${props.prefix}_action`)
const messageKey = computed(() => `${props.prefix}_message`)
const assignUserKey = computed(() => `${props.prefix}_assign_user_id`)
const assignBotKey = computed(() => `${props.prefix}_assign_bot_id`)

watch(
  () => props.conf[actionKey.value],
  (newAction) => {
    if (newAction === 'assign_user') {
      if (!props.conf[assignUserKey.value] && userStore.users.length > 0) {
        props.conf[assignUserKey.value] = userStore.users[0].id
      }

      props.conf[assignBotKey.value] = undefined
      props.conf[messageKey.value] = undefined
    } else if (newAction === 'assign_bot') {
      if (!props.conf[assignBotKey.value] && userStore.users.length > 0) {
        props.conf[assignBotKey.value] = userStore.users[0].id
      }
      props.conf[assignUserKey.value] = undefined
      props.conf[messageKey.value] = undefined
    } else if (newAction === 'message') {
      props.conf[assignUserKey.value] = undefined
      props.conf[assignBotKey.value] = undefined
    } else {
      props.conf[assignUserKey.value] = undefined
      props.conf[assignBotKey.value] = undefined
      props.conf[messageKey.value] = undefined
    }
  },
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center">
      <div class="flex gap-1 min-w-[40%]">
        <label>{{ $t(`bot_details.action`) }}</label>
      </div>
      <Select
        v-model="conf[actionKey]"
        :options="actions"
        :optionLabel="(action) => $t(`bot_details.conf_actions.${action}`)"
      />
    </div>

    <!-- MESSAGE -->
    <div v-if="conf[actionKey] === 'message'" class="flex flex-col gap-8">
      <div class="flex items-center">
        <div class="flex gap-1 min-w-[40%]">
          <label>{{ $t(`bot_details.${messageKey}`) }}</label>
        </div>
        <Textarea v-model="conf[messageKey]" rows="4" fluid class="text-lg!" :maxlength="1024" />
      </div>
    </div>

    <!-- ASSIGN USER -->
    <div v-else-if="conf[actionKey] === 'assign_user'" class="flex flex-col gap-8">
      <div class="flex items-center">
        <div class="flex gap-1 min-w-[40%]">
          <label>{{ $t(`bot_details.${assignUserKey}`) }}</label>
        </div>
        <Select
          :modelValue="conf[assignUserKey]"
          @change="conf[assignUserKey] = $event.value"
          :options="userStore.users"
          optionValue="id"
          optionLabel="name"
          :loading="userStore.loading"
          :placeholder="$t('bot_details.select_user')"
        />
      </div>
    </div>

    <!-- ASSIGN BOT -->
    <div v-else-if="conf[actionKey] === 'assign_bot'" class="flex flex-col gap-8">
      <div class="flex items-center">
        <div class="flex gap-1 min-w-[40%]">
          <label>{{ $t(`bot_details.${assignBotKey}`) }}</label>
        </div>
        <Select
          :modelValue="conf[assignBotKey]"
          @change="conf[assignBotKey] = $event.value"
          :options="botStore.bots"
          optionValue="id"
          optionLabel="name"
          :loading="botStore.loading"
          :placeholder="$t('bot_details.select_bot')"
        />
      </div>
    </div>
  </div>
</template>
