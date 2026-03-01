<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import moment from 'moment'
import { IconCreditCard, IconAlertTriangle } from '@tabler/icons-vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import WarningDialog from '~/components/WarningDialog.vue'
import SubscriptionDialog from '~/components/subscription/SubscriptionDialog.vue'
import { API } from '~/services'
import type { Subscription } from '~/types/Subscription'

const { t } = useI18n()
const toast = useToast()

const loading = ref(false)
const currentSubscription = ref<Subscription | null>(null)
const showUpgradeDialog = ref(false)
const showCancelDialog = ref(false)
const cancellingSubscription = ref(false)

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
  return moment(date).format('DD/MM/YYYY')
}

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return null
  return new Intl.NumberFormat().format(num)
}

const getUsagePercentage = (used: number, max: number | null) => {
  if (!max) return 0
  return Math.min((used / max) * 100, 100)
}

const loadCurrentSubscription = async () => {
  loading.value = true
  try {
    const response = await API.subscription.getCurrentSubscription()
    currentSubscription.value = response.data?.data || null
  } catch (error) {
    console.error('Failed to load subscription:', error)
    toast.add({
      severity: 'error',
      summary: t('subscription.error'),
      detail: t('subscription.load_error'),
      life: 3000,
    })
  } finally {
    loading.value = false
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

    // Update the subscription status locally to cancelled
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

    // Reload to get the updated status from server
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

onMounted(() => {
  loadCurrentSubscription()
})
</script>

<template>
  <div class="flex flex-col gap-6 h-full p-6">
    <div class="flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="font-semibold text-2xl">{{ $t('subscription.title') }}</h1>
      </div>
    </div>

    <!-- Current Plan Section -->
    <div class="bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">{{ $t('subscription.current_plan') }}</h2>
          <Tag
            :severity="currentSubscription?.is_active ? 'success' : 'secondary'"
            :value="
              currentSubscription?.is_active
                ? $t('subscription.active')
                : $t('subscription.inactive')
            "
          />
        </div>
      </div>
      <div class="p-6">
        <div v-if="loading" class="flex justify-center py-8">
          <ProgressSpinner />
        </div>
        <div v-else-if="currentSubscription" class="space-y-4">
          <!-- Plan Overview -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('subscription.plan_name') }}
              </p>
              <p class="text-lg font-semibold">
                {{ formatPlanName(currentSubscription.plan_type) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('subscription.billing_cycle') }}
              </p>
              <p class="text-lg font-semibold">
                {{ formatBillingCycle(currentSubscription.billing_cycle) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('subscription.amount') }}
              </p>
              <p class="text-lg font-semibold">
                ${{ currentSubscription.pricing?.amount || '0' }}/{{
                  currentSubscription.billing_cycle === 'monthly'
                    ? $t('subscription.month')
                    : $t('subscription.year')
                }}
              </p>
            </div>
          </div>

          <Divider />

          <!-- Usage & Limits -->
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ $t('subscription.users') }}
              </p>
              <div class="flex items-center gap-3">
                <span class="text-lg font-medium"
                  >{{ currentSubscription.limits?.used_users || 0 }} /
                  {{ currentSubscription.limits?.max_users || $t('subscription.unlimited') }}</span
                >
                <div
                  v-if="currentSubscription.limits?.max_users"
                  class="flex-1 bg-gray-200 rounded-full h-2"
                >
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    :style="{
                      width:
                        getUsagePercentage(
                          currentSubscription.limits.used_users,
                          currentSubscription.limits.max_users,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>
              <p
                v-if="currentSubscription.limits?.extra_users_purchased > 0"
                class="text-sm text-green-600 mt-1"
              >
                +{{ currentSubscription.limits.extra_users_purchased }}
                {{ $t('subscription.extra_users') }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ $t('subscription.contacts') }}
              </p>
              <div class="flex items-center gap-3">
                <span class="text-lg font-medium"
                  >{{ formatNumber(currentSubscription.limits?.used_contacts || 0) }}
                  /
                  {{
                    formatNumber(currentSubscription.limits?.max_contacts) ||
                    $t('subscription.unlimited')
                  }}</span
                >
                <div
                  v-if="currentSubscription.limits?.max_contacts"
                  class="flex-1 bg-gray-200 rounded-full h-2"
                >
                  <div
                    class="bg-green-600 h-2 rounded-full transition-all duration-300"
                    :style="{
                      width:
                        getUsagePercentage(
                          currentSubscription.limits.used_contacts,
                          currentSubscription.limits.max_contacts,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ $t('subscription.whatsapp_numbers') }}
              </p>
              <div class="flex items-center gap-3">
                <span class="text-lg font-medium"
                  >{{ currentSubscription.limits?.used_whatsapp_numbers || 0 }} /
                  {{
                    currentSubscription.limits?.max_whatsapp_numbers || $t('subscription.unlimited')
                  }}</span
                >
                <div
                  v-if="currentSubscription.limits?.max_whatsapp_numbers"
                  class="flex-1 bg-gray-200 rounded-full h-2"
                >
                  <div
                    class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    :style="{
                      width:
                        getUsagePercentage(
                          currentSubscription.limits.used_whatsapp_numbers,
                          currentSubscription.limits.max_whatsapp_numbers,
                        ) + '%',
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <Divider />

          <!-- Subscription Dates -->
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('subscription.started_on') }}
              </p>
              <p class="text-lg">
                {{ formatDate(currentSubscription.dates?.start_date) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ $t('subscription.expires_on') }}
              </p>
              <p class="text-lg">
                {{ formatDate(currentSubscription.dates?.end_date) }}
              </p>
            </div>
          </div>

          <!-- Grace Period Notice -->
          <div
            v-if="currentSubscription.is_in_grace_period"
            class="mt-4 rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20"
          >
            <div class="flex">
              <IconAlertTriangle class="h-5 w-5 text-orange-400" />
              <div class="ml-3">
                <p class="text-sm font-medium text-orange-800 dark:text-orange-200">
                  {{ $t('subscription.grace_period_notice') }}
                </p>
                <p class="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  {{
                    $t('subscription.grace_period_ends', {
                      date: formatDate(currentSubscription.dates?.grace_period_ends_at),
                    })
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2 pt-4">
            <Button
              :label="$t('subscription.upgrade_plan')"
              icon="pi pi-arrow-up"
              @click="showUpgradeDialog = true"
            />
            <Button
              v-if="currentSubscription.is_active && !currentSubscription.dates?.cancelled_at"
              :label="$t('subscription.cancel_subscription')"
              severity="danger"
              outlined
              icon="pi pi-times"
              @click="handleCancelSubscription"
            />
          </div>
        </div>
        <div v-else class="py-8 text-center">
          <IconCreditCard class="mx-auto h-12 w-12 text-gray-400" />
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {{ $t('subscription.no_active_plan') }}
          </h3>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            {{ $t('subscription.no_active_plan_description') }}
          </p>
          <Button
            :label="$t('subscription.choose_plan')"
            icon="pi pi-plus"
            class="mt-4"
            @click="showUpgradeDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Upgrade Dialog -->
    <SubscriptionDialog v-model:visible="showUpgradeDialog" />

    <!-- Cancel Subscription Warning Dialog -->
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

<style lang="css" scoped>
:deep(.p-datatable-paginator-bottom) {
  border: none;
}
</style>
