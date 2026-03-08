<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { IconCircleCheck, IconEdit, IconPlugConnectedX, IconPlus } from '@tabler/icons-vue'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useFeatureAccess } from '~/composables/useFeatureAccess'
import type { WABANumber, Column } from '~/types'
import PhoneNumberProfileDrawer from './PhoneNumberProfileDrawer.vue'
import AddNumberDialog from './AddNumberDialog.vue'

const props = defineProps<{
  phoneNumbers: WABANumber[]
  loading: boolean
  wabaId: string
  disableRowClick?: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const { requireSubscription } = useFeatureAccess()
const selectedNumber = ref<WABANumber | null>(null)
const drawerVisible = ref(false)
const disconnectTarget = ref<WABANumber | null>(null)
const showDisconnectDialog = ref(false)
const disconnecting = ref(false)
const showAddDialog = ref(false)

const qualitySeverity = (rating: string) => {
  switch (rating) {
    case 'GREEN':
      return 'success'
    case 'YELLOW':
      return 'warn'
    case 'RED':
      return 'danger'
    default:
      return 'secondary'
  }
}

const messagingLimitLabel = (tier?: string) => {
  switch (tier) {
    case 'TIER_1K':
      return '1K'
    case 'TIER_10K':
      return '10K'
    case 'TIER_100K':
      return '100K'
    case 'TIER_UNLIMITED':
      return t('whatsapp_settings.unlimited')
    default:
      return '-'
  }
}

const columns = computed<Column[]>(() => [
  { header: t('whatsapp_settings.headers.phone_number'), key: 'display_phone_number' },
  { header: t('whatsapp_settings.headers.verified_name'), key: 'verified_name' },
  { header: t('whatsapp_settings.headers.quality'), key: 'quality', type: 'CUSTOM' },
  { header: t('whatsapp_settings.headers.messaging_limit'), key: 'messagingLimit' },
  { header: t('whatsapp_settings.headers.status'), key: 'status', type: 'CUSTOM' },
  { header: t('whatsapp_settings.headers.oba'), key: 'oba', type: 'CUSTOM' },
  { header: '', key: 'actions', type: 'ACTIONS', bodyStyle: { maxWidth: '50px' } },
])

const numberActions = (number: WABANumber) => {
  return [
    [
      {
        label: t('whatsapp_settings.edit_profile'),
        icon: IconEdit,
        action: () => openDrawer(number),
      },
    ],
    [
      {
        label: t('whatsapp_settings.disconnect'),
        icon: IconPlugConnectedX,
        class: 'text-red-600',
        action: () => confirmDisconnect(number),
      },
    ],
  ]
}

const statusSeverity = (status: string) => {
  switch (status) {
    case 'CONNECTED':
      return 'success'
    case 'FLAGGED':
    case 'RESTRICTED':
      return 'danger'
    default:
      return 'warn'
  }
}

const transformedData = computed(() => {
  return props.phoneNumbers.map((number) => ({
    ...number,
    messagingLimit: messagingLimitLabel(number.messaging_limit_tier),
    actions: numberActions,
  }))
})

const openDrawer = (number: WABANumber) => {
  selectedNumber.value = number
  drawerVisible.value = true
}

const confirmDisconnect = (number: WABANumber) => {
  disconnectTarget.value = number
  showDisconnectDialog.value = true
}

const onDisconnect = async () => {
  if (!disconnectTarget.value) return
  disconnecting.value = true
  try {
    await API.tenant.disconnectPhoneNumber(disconnectTarget.value.id)
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('whatsapp_settings.disconnected_successfully'),
      life: 3000,
    })
    showDisconnectDialog.value = false
    disconnectTarget.value = null
    emit('refresh')
  } catch (error) {
    handleError(error)
  } finally {
    disconnecting.value = false
  }
}

const onRowClick = (event: { data: WABANumber }) => {
  openDrawer(event.data)
}

const onProfileSaved = () => {
  emit('refresh')
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-end">
      <Button @click="requireSubscription() && (showAddDialog = true)">
        <IconPlus size="16" class="mr-1" />
        <span>{{ $t('whatsapp_settings.add_number') }}</span>
      </Button>
    </div>
    <Table
      :data="transformedData"
      :columns="columns"
      :loading="loading"
      :hoverable="!props.disableRowClick"
      emptyMessage="whatsapp_settings.no_numbers"
      @onRowClick="!props.disableRowClick && onRowClick($event)"
    >
      <template #quality="{ data }: { data: WABANumber }">
        <Tag
          v-tooltip.bottom="{
            value: $t(`whatsapp_settings.quality_rating.tooltip.${data.quality_rating || 'UNKNOWN'}`),
            class: 'max-w-[300px]!',
          }"
          :value="$t(`whatsapp_settings.quality_rating.${data.quality_rating || 'UNKNOWN'}`)"
          :severity="qualitySeverity(data.quality_rating)"
          class="text-base! cursor-help"
        />
      </template>
      <template #status="{ data }: { data: WABANumber }">
        <Tag
          v-tooltip.bottom="{
            value: $t(`whatsapp_settings.phone_status.tooltip.${data.status}`),
            class: 'max-w-[300px]!',
          }"
          :value="$t(`whatsapp_settings.phone_status.${data.status}`)"
          :severity="statusSeverity(data.status)"
          class="text-base! cursor-help"
        />
      </template>
      <template #oba="{ data }: { data: WABANumber }">
        <div class="flex justify-center">
          <IconCircleCheck
            v-if="data.is_official_business_account"
            size="20"
            class="text-green-600"
          />
          <span v-else class="text-slate-400">-</span>
        </div>
      </template>
    </Table>

    <PhoneNumberProfileDrawer
      v-model:visible="drawerVisible"
      :phoneNumber="selectedNumber"
      @saved="onProfileSaved"
    />

    <WarningDialog
      v-model:visible="showDisconnectDialog"
      :title="$t('whatsapp_settings.disconnect_title')"
      :message="$t('whatsapp_settings.disconnect_message')"
      :confirmMessage="$t('whatsapp_settings.disconnect')"
      :loading="disconnecting"
      @onConfirm="onDisconnect"
    />

    <AddNumberDialog
      v-model:visible="showAddDialog"
      :wabaId="wabaId"
      @connected="emit('refresh')"
    />
  </div>
</template>
