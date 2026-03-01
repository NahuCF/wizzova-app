<script setup lang="ts">
import { IconAsterisk, IconLoader2 } from '@tabler/icons-vue'
import { ref, watch } from 'vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useBotStore, useUserStore } from '~/stores'
import type { BotAction, BotConfiguration, BotItem } from '~/types'

const props = defineProps<{
  bot?: BotItem
}>()

const emit = defineEmits<{
  (e: 'onSave', botItem: BotItem): void
}>()

const handleError = useErrorHandler()
const userStore = useUserStore()
const botStore = useBotStore()

const conf = ref<BotConfiguration>({
  name: '',
  wait_time_minutes: 5,
  timeout_action: 'message',
  no_match_action: 'no_action',
  end_conversation_action: 'no_action',
  about_to_end_action: 'no_action',
})
const actions = ref<BotAction[]>(['no_action', 'assign_user', 'assign_bot', 'message'])
const loading = ref(false)

const saveConfiguration = async () => {
  if (!props.bot) return

  loading.value = true
  try {
    const { data: response } = await API.bot.configuration(props.bot.id, conf.value)
    emit('onSave', response.data)
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.bot,
  () => {
    if (props.bot) {
      conf.value = {
        ...props.bot,
        wait_time_minutes: props.bot.wait_time_minutes || 1,
        about_to_end_time_minutes: props.bot.about_to_end_time_minutes || 1,
        timeout_action: props.bot.timeout_action || 'no_action',
        no_match_action: props.bot.no_match_action || 'no_action',
        end_conversation_action: props.bot.end_conversation_action || 'no_action',
        about_to_end_action: props.bot.about_to_end_action || 'no_action',
      }
    }
  },
  { immediate: true },
)

if (userStore.users.length === 0) {
  userStore.fetchUsers()
}
if (botStore.bots.length === 0) {
  botStore.fetchBots()
}
</script>

<template>
  <div class="flex flex-col gap-12 px-60 pb-6">
    <div class="flex flex-col gap-1 relative">
      <div class="flex gap-1">
        <label for="name" class="text-lg">{{ $t('bots.create_form.name') }}</label>
        <IconAsterisk color="red" class="mt-1" size="8" />
      </div>
      <div class="relative">
        <InputText
          v-model="conf.name"
          class="!pr-[5.5rem]"
          name="name"
          id="name"
          fluid
          :maxlength="512"
          :placeholder="$t('bots.create_form.name_placeholder')"
        />
      </div>
    </div>

    <div>
      <Collapsable class="w-full" :text="$t('bot_details.if_client_doesnt_answer')" defaultOpen>
        <div class="pt-3 flex flex-col gap-4">
          <div class="flex flex-col gap-8">
            <div class="flex items-center">
              <div class="flex gap-1 min-w-[40%]">
                <label for="name">{{ $t('bot_details.wait_time_minutes') }}</label>
              </div>

              <InputGroup class="max-w-[200px]">
                <InputText
                  :modelValue="conf.wait_time_minutes.toString()"
                  @update:modelValue="
                    ($event) => {
                      $event
                        ? (conf.wait_time_minutes = Number($event))
                        : (conf.wait_time_minutes = 1)
                    }
                  "
                  :placeholder="$t('bot_details.enter_minutes')"
                  v-keyfilter="/[1-9]/"
                />
                <InputGroupAddon>{{ $t('minutes') }}</InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <BotActionSelector prefix="timeout" :conf="conf" :actions="actions" />
        </div>
      </Collapsable>
    </div>

    <div>
      <Collapsable class="w-full" :text="$t('bot_details.if_session_is_ending')">
        <div class="pt-3 flex flex-col gap-4">
          <div class="flex flex-col gap-8">
            <div class="flex items-center">
              <div class="flex gap-1 min-w-[40%]">
                <label for="name">{{ $t('bot_details.about_to_end_time_minutes') }}</label>
              </div>

              <InputGroup class="max-w-[200px]">
                <InputText
                  :modelValue="conf.about_to_end_time_minutes?.toString()"
                  @update:modelValue="
                    ($event) => {
                      $event
                        ? (conf.about_to_end_time_minutes = Number($event))
                        : (conf.about_to_end_time_minutes = 1)
                    }
                  "
                  :placeholder="$t('bot_details.enter_minutes')"
                  v-keyfilter="/[1-9]/"
                />
                <InputGroupAddon>{{ $t('minutes') }}</InputGroupAddon>
              </InputGroup>
            </div>
          </div>

          <BotActionSelector prefix="about_to_end" :conf="conf" :actions="actions" />
        </div>
      </Collapsable>
    </div>

    <div>
      <Collapsable class="w-full" :text="$t('bot_details.if_session_ends')">
        <div class="pt-3 flex flex-col gap-4">
          <BotActionSelector prefix="end_conversation" :conf="conf" :actions="actions" />
        </div>
      </Collapsable>
    </div>

    <div>
      <Collapsable class="w-full" :text="$t('bot_details.if_no_match')">
        <div class="pt-3 flex flex-col gap-4">
          <BotActionSelector prefix="no_match" :conf="conf" :actions="actions" />
        </div>
      </Collapsable>
    </div>

    <div class="flex justify-end">
      <div>
        <Button @click="saveConfiguration" :disabled="!conf.name">
          <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
          <span v-else>
            {{ $t(`save`) }}
          </span>
        </Button>
      </div>
    </div>
  </div>
</template>
