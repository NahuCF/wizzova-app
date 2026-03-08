<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useRoute, useRouter } from 'vue-router'
import moment from 'moment'
import {
  IconCreditCard,
  IconAlertTriangle,
  IconUsers,
  IconAddressBook,
  IconBrandWhatsapp,
  IconLoader2,
} from '@tabler/icons-vue'
import Table from '~/components/common/Table.vue'
import WarningDialog from '~/components/WarningDialog.vue'
import SubscriptionDialog from '~/components/subscription/SubscriptionDialog.vue'
import { API } from '~/services'
import { usePusher } from '~/composables/pusher/usePusher'
import { useSessionStore } from '~/stores'
import type { Subscription, Payment } from '~/types/Subscription'
import type { Column } from '~/types'
import type { Channel } from 'pusher-js'

const { t } = useI18n()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const sessionStore = useSessionStore()
const { subscribe, unsubscribe } = usePusher()

const loading = ref(false)
const currentSubscription = ref<Subscription | null>(null)
const showUpgradeDialog = ref(false)
const showCancelDialog = ref(false)
const cancellingSubscription = ref(false)
const payments = ref<Payment[]>([])
const loadingPayments = ref(false)
const waitingForPayment = ref(false)

let subscriptionChannel: Channel | null = null

const formatPlanName = (planType: string) => {
  const plans: Record<string, string> = {
    growth: t('subscription.plan.growth'),
    scale: t('subscription.plan.scale'),
    pro: t('subscription.plan.pro'),
  }
  return plans[planType] || planType
}

const formatBillingCycle = (cycle: string) => {
  return cycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')
}

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '-'
  return moment(date).format('DD MMM YYYY')
}

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return null
  return new Intl.NumberFormat().format(num)
}

const getUsagePercentage = (used: number, max: number | null) => {
  if (!max) return 0
  return Math.min((used / max) * 100, 100)
}

const getUsageBarColor = (used: number, max: number | null) => {
  if (!max) return 'bg-slate-300'
  const pct = (used / max) * 100
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-400'
  return 'bg-slate-300'
}

const paymentSeverity = (status: string) => {
  const successStatuses = ['completed', 'mercadopago_approved', 'stripe_succeeded']
  const pendingStatuses = ['pending', 'mercadopago_pending', 'mercadopago_in_process', 'mercadopago_authorized', 'stripe_pending', 'stripe_processing', 'stripe_requires_action']
  const failedStatuses = ['failed', 'mercadopago_rejected', 'stripe_failed']
  const refundedStatuses = ['refunded', 'mercadopago_refunded', 'mercadopago_partially_refunded', 'mercadopago_charged_back']

  if (successStatuses.includes(status)) return 'success'
  if (pendingStatuses.includes(status)) return 'warn'
  if (failedStatuses.includes(status)) return 'danger'
  if (refundedStatuses.includes(status)) return 'info'
  return 'secondary'
}

const paymentColumns: Column[] = [
  { header: t('subscription.date'), key: 'date', type: 'CUSTOM' },
  { header: t('subscription.amount'), key: 'amount', type: 'CUSTOM' },
  { header: t('subscription.status'), key: 'status', type: 'TAG' },
]

const transformedPayments = computed(() =>
  payments.value.map((p) => ({
    id: p.id,
    date: formatDate(p.created_at),
    amount: `$${p.amount} ${p.currency}`,
    status: {
      label: t(`subscription.payment_status.${p.status}`),
      severity: paymentSeverity(p.status),
    },
  })),
)

const usageCards = computed(() => {
  if (!currentSubscription.value) return []
  const limits = currentSubscription.value.limits
  const totalMaxUsers = (limits?.max_users ?? 0) + (limits?.extra_users_purchased ?? 0)

  return [
    {
      key: 'users',
      label: t('subscription.users'),
      icon: IconUsers,
      used: limits?.used_users ?? 0,
      max: limits?.max_users !== null && limits?.max_users !== undefined ? totalMaxUsers : null,
      extra: limits?.extra_users_purchased
        ? `+${limits.extra_users_purchased} ${t('subscription.extra_users')}`
        : undefined,
    },
    {
      key: 'contacts',
      label: t('subscription.contacts'),
      icon: IconAddressBook,
      used: limits?.used_contacts ?? 0,
      max: limits?.max_contacts ?? null,
    },
    {
      key: 'whatsapp',
      label: t('subscription.whatsapp_numbers'),
      icon: IconBrandWhatsapp,
      used: limits?.used_whatsapp_numbers ?? 0,
      max: limits?.max_whatsapp_numbers ?? null,
    },
  ]
})

const loadCurrentSubscription = async () => {
  loading.value = true
  try {
    const response = await API.subscription.getCurrentSubscription()
    currentSubscription.value = response.data?.data || null
  } catch (error) {
    console.error('Failed to load subscription:', error)
  } finally {
    loading.value = false
  }
}

const loadPayments = async () => {
  loadingPayments.value = true
  try {
    const response = await API.subscription.getPaymentHistory({ rows_per_page: 10 })
    payments.value = response.data?.data || []
  } catch (error) {
    console.error('Failed to load payments:', error)
  } finally {
    loadingPayments.value = false
  }
}

const handleCancelSubscription = () => {
  showCancelDialog.value = true
}

const confirmCancelSubscription = async () => {
  cancellingSubscription.value = true
  try {
    await API.subscription.cancelSubscription()
    showCancelDialog.value = false

    if (currentSubscription.value) {
      currentSubscription.value.is_active = false
      currentSubscription.value.dates.cancelled_at = new Date().toISOString()
    }

    toast.add({
      severity: 'success',
      summary: t('subscription.success'),
      detail: t('subscription.cancel_success'),
      life: 3000,
    })

    await loadCurrentSubscription()
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    toast.add({
      severity: 'error',
      summary: t('subscription.error'),
      detail: t('subscription.cancel_error'),
      life: 3000,
    })
  } finally {
    cancellingSubscription.value = false
  }
}

const onPaymentConfirmed = async () => {
  stopWaiting()
  await loadCurrentSubscription()
  await loadPayments()

  if (currentSubscription.value) {
    sessionStore.tenant = {
      ...sessionStore.tenant!,
      subscription: currentSubscription.value,
    }
  }

  toast.add({
    severity: 'success',
    summary: t('subscription.success'),
    detail: t('subscription.payment_confirmed'),
    life: 5000,
  })
}

const startWaiting = () => {
  waitingForPayment.value = true

  if (sessionStore.tenant) {
    const channelName = `private-tenant.${sessionStore.tenant.id}.subscription`
    subscriptionChannel = subscribe(channelName)
    subscriptionChannel.bind('subscription.updated', onPaymentConfirmed)
  }
}

const stopWaiting = () => {
  waitingForPayment.value = false

  if (subscriptionChannel) {
    subscriptionChannel.unbind('subscription.updated', onPaymentConfirmed)
    unsubscribe(subscriptionChannel.name)
    subscriptionChannel = null
  }

  router.replace({ query: {} })
}

onMounted(() => {
  loadCurrentSubscription()
  loadPayments()

  if (route.query.upgrade === 'true') {
    showUpgradeDialog.value = true
    router.replace({ query: {} })
  }

  if (route.query.status === 'pending') {
    startWaiting()
  }

  if (route.query.status === 'failed') {
    toast.add({
      severity: 'error',
      summary: t('subscription.error'),
      detail: t('subscription.payment_failed'),
      life: 5000,
    })
    router.replace({ query: {} })
  }
})

onBeforeUnmount(() => {
  stopWaiting()
})
</script>

<template>
  <div class="flex flex-col gap-6 h-full p-6">
    <div class="flex justify-between items-center">
      <h1 class="font-semibold text-2xl">{{ $t('subscription.title') }}</h1>
      <div v-if="currentSubscription" class="flex gap-2">
        <Button v-if="currentSubscription.plan_type !== 'pro'" @click="showUpgradeDialog = true">
          {{ $t('subscription.upgrade_plan') }}
        </Button>
        <Button
          v-if="currentSubscription.is_active && !currentSubscription.dates?.cancelled_at"
          :label="$t('subscription.cancel_subscription')"
          severity="danger"
          variant="outlined"
          @click="handleCancelSubscription"
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <ProgressSpinner />
    </div>

    <template v-else-if="currentSubscription">
      <div class="bg-white rounded-lg border border-slate-200 p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div>
              <p class="text-sm text-gray-500">{{ $t('subscription.plan_name') }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-lg font-semibold">{{ formatPlanName(currentSubscription.plan_type) }}</span>
                <Tag
                  :severity="currentSubscription.is_active ? 'success' : 'secondary'"
                  :value="currentSubscription.is_active ? $t('subscription.active') : $t('subscription.inactive')"
                />
              </div>
            </div>
            <Divider layout="vertical" class="h-10!" />
            <div>
              <p class="text-sm text-gray-500">{{ $t('subscription.billing_cycle') }}</p>
              <p class="text-lg font-semibold mt-1">{{ formatBillingCycle(currentSubscription.billing_cycle) }}</p>
            </div>
            <Divider layout="vertical" class="h-10!" />
            <div>
              <p class="text-sm text-gray-500">{{ $t('subscription.amount') }}</p>
              <p class="text-lg font-semibold mt-1">
                ${{ currentSubscription.pricing?.amount || '0' }}
                <span class="text-sm font-normal text-gray-500">
                  /{{ currentSubscription.billing_cycle === 'monthly' ? $t('subscription.month') : $t('subscription.year') }}
                </span>
              </p>
            </div>
            <Divider layout="vertical" class="h-10!" />
            <div>
              <p class="text-sm text-gray-500">{{ $t('subscription.next_billing_date') }}</p>
              <p class="text-lg font-semibold mt-1">{{ formatDate(currentSubscription.dates?.end_date) }}</p>
            </div>
            <Divider layout="vertical" class="h-10!" />
            <div>
              <p class="text-sm text-gray-500">{{ $t('subscription.member_since') }}</p>
              <p class="text-lg font-semibold mt-1">{{ formatDate(currentSubscription.dates?.start_date) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="card in usageCards"
          :key="card.key"
          class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-3"
        >
          <div class="flex gap-2 items-center">
            <component :is="card.icon" class="w-[20px] h-[20px] text-gray-500" />
            <span class="font-normal text-gray-500">{{ card.label.toUpperCase() }}</span>
          </div>
          <div class="flex gap-2 items-baseline">
            <span class="text-xl font-bold">{{ formatNumber(card.used) }}</span>
            <span class="text-gray-400">
              / {{ card.max !== null ? formatNumber(card.max) : '∞' }}
            </span>
          </div>
          <div v-if="card.max !== null" class="w-full bg-gray-100 rounded-full h-1.5">
            <div
              class="h-1.5 rounded-full transition-all duration-500"
              :class="getUsageBarColor(card.used, card.max)"
              :style="{ width: Math.max(getUsagePercentage(card.used, card.max), 2) + '%' }"
            ></div>
          </div>
          <p v-if="card.extra" class="text-xs text-gray-500">{{ card.extra }}</p>
        </div>
      </div>

      <div
        v-if="currentSubscription.is_in_grace_period"
        class="rounded-lg bg-orange-50 border border-orange-200 p-4"
      >
        <div class="flex items-start gap-3">
          <IconAlertTriangle class="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-orange-800">
              {{ $t('subscription.grace_period_notice') }}
            </p>
            <p class="mt-1 text-sm text-orange-600">
              {{ $t('subscription.grace_period_ends', { date: formatDate(currentSubscription.dates?.grace_period_ends_at) }) }}
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="currentSubscription.dates?.cancelled_at"
        class="rounded-lg bg-red-50 border border-red-200 p-4"
      >
        <div class="flex items-start gap-3">
          <IconAlertTriangle class="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p class="text-sm font-medium text-red-800">
              {{ $t('subscription.cancelled_notice') }}
            </p>
            <p class="mt-1 text-sm text-red-600">
              {{ $t('subscription.cancelled_date', { date: formatDate(currentSubscription.dates?.cancelled_at) }) }}
            </p>
          </div>
        </div>
      </div>

      <h2 class="text-lg font-semibold">{{ $t('subscription.payment_history') }}</h2>
      <div class="bg-white border border-slate-200 rounded-lg">
        <Table
          :data="transformedPayments"
          :columns="paymentColumns"
          :loading="loadingPayments"
          emptyMessage="subscription.no_payments"
        >
          <template #date="{ data }">
            <span class="text-base">{{ data.date }}</span>
          </template>
          <template #amount="{ data }">
            <span class="text-base">{{ data.amount }}</span>
          </template>
        </Table>
      </div>
    </template>

    <div v-else class="bg-white rounded-lg border border-slate-200 py-16 text-center">
      <IconCreditCard class="mx-auto h-12 w-12 text-gray-300" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">
        {{ $t('subscription.no_active_plan') }}
      </h3>
      <p class="mt-2 text-gray-500">
        {{ $t('subscription.no_active_plan_description') }}
      </p>
      <Button
        :label="$t('subscription.choose_plan')"
        class="mt-4"
        @click="showUpgradeDialog = true"
      />
    </div>

    <Dialog
      :visible="waitingForPayment"
      :modal="true"
      :closable="false"
      :draggable="false"
      pt:mask:class="backdrop-blur-sm"
      :style="{ width: '420px' }"
    >
      <template #header>
        <span></span>
      </template>
      <div class="flex flex-col items-center gap-6 py-4">
        <IconLoader2 class="animate-spin text-blue-500" size="48" />
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-2">{{ $t('subscription.waiting_for_payment') }}</h3>
          <p class="text-gray-500">{{ $t('subscription.waiting_for_payment_description') }}</p>
        </div>
      </div>
    </Dialog>

    <SubscriptionDialog v-model:visible="showUpgradeDialog" :current-plan-type="currentSubscription?.plan_type ?? null" />

    <WarningDialog
      v-model:visible="showCancelDialog"
      :title="$t('subscription.cancel_subscription')"
      :message="$t('subscription.cancel_confirm')"
      :loading="cancellingSubscription"
      :confirmMessage="$t('subscription.cancel_subscription')"
      :cancelMessage="$t('cancel')"
      confirmColor="danger"
      @onConfirm="confirmCancelSubscription"
    />
  </div>
</template>
