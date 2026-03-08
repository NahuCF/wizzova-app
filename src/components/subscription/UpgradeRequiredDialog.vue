<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconCrown } from '@tabler/icons-vue'
import { useSubscriptionStore } from '~/stores/subscription'

const { t, te } = useI18n()
const subscriptionStore = useSubscriptionStore()

const visible = computed({
  get: () => subscriptionStore.upgradeModalVisible,
  set: (val) => {
    if (!val) subscriptionStore.hideUpgradeModal()
  },
})

const data = computed(() => subscriptionStore.upgradeModalData)

const message = computed(() => {
  if (!data.value) return ''

  const key = `upgrade_modal.${data.value.messageCode}`
  if (te(key)) return t(key)

  const validationKey = `validation_errors.${data.value.messageCode}`
  if (te(validationKey)) return t(validationKey)

  return t('upgrade_modal.default_message')
})

const showUsage = computed(() => {
  return data.value?.limit !== undefined && data.value?.used !== undefined
})

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return '0'
  return new Intl.NumberFormat().format(num)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :draggable="false"
    :style="{ width: '450px' }"
    :closable="true"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
          <IconCrown class="text-amber-500" size="22" />
        </div>
        <h2 class="text-xl font-bold">{{ $t('upgrade_modal.title') }}</h2>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <p class="text-gray-600">{{ message }}</p>

      <div
        v-if="showUsage"
        class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <span class="text-sm text-gray-500">{{ $t('upgrade_modal.current_usage') }}</span>
        <span class="font-semibold">
          {{ formatNumber(data?.used) }} / {{ formatNumber(data?.limit) }}
        </span>
      </div>

      <div v-if="data?.requiredPlan" class="flex items-center gap-2 text-sm text-gray-500">
        <span>{{ $t('upgrade_modal.available_from') }}</span>
        <Tag :value="data.requiredPlan.charAt(0).toUpperCase() + data.requiredPlan.slice(1)" severity="info" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          :label="$t('upgrade_modal.maybe_later')"
          severity="secondary"
          @click="subscriptionStore.hideUpgradeModal()"
        />
        <Button
          :label="$t('upgrade_modal.upgrade_plan')"
          @click="subscriptionStore.redirectToUpgrade()"
        />
      </div>
    </template>
  </Dialog>
</template>
