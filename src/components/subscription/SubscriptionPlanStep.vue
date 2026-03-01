<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconCheck } from '@tabler/icons-vue'
import type { PlanType, BillingCycle } from '~/types'

interface Plan {
  type: PlanType
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  maxUsers: number | null
  maxContacts: number | null
  maxWhatsappNumbers: number | null
  extraUserPrice: number
  features: string[]
  allowsExtraUsers: boolean
  previousPlanName?: string
  popular?: boolean
}

const planStyles: Record<PlanType, { bg: string; border: string; shadow: string }> = {
  growth: { bg: '#e6f4ff', border: '#b3d9f7', shadow: 'rgba(179, 217, 247, 0.4)' },
  scale: { bg: '#f0fff3', border: '#b3e6c0', shadow: 'rgba(179, 230, 192, 0.4)' },
  pro: { bg: '#f9f5ff', border: '#d4bff0', shadow: 'rgba(212, 191, 240, 0.4)' },
}

const props = defineProps<{
  plans: Plan[]
  billingCycle: BillingCycle
}>()

const emit = defineEmits<{
  'update:billingCycle': [value: BillingCycle]
  selectPlan: [plan: Plan]
}>()

const { t } = useI18n()

const isYearly = computed(() => props.billingCycle === 'yearly')

const getPlanPrice = (plan: Plan) => {
  return isYearly.value ? plan.yearlyPrice : plan.monthlyPrice
}

const getExtraUserPrice = (plan: Plan) => {
  return plan.extraUserPrice
}

const formatLimit = (value: number | null, suffix?: string) => {
  if (value === null) return t('subscription.unlimited')
  return suffix ? `${value} ${suffix}` : value.toString()
}

const selectPlan = (plan: Plan) => {
  emit('selectPlan', plan)
}

const setBillingCycle = (cycle: BillingCycle) => {
  emit('update:billingCycle', cycle)
}
</script>

<template>
  <div>
    <div class="flex justify-center mb-6">
      <div class="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
        <button
          @click="setBillingCycle('monthly')"
          :class="[
            'px-4 py-2 rounded-md transition-all',
            props.billingCycle === 'monthly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          {{ $t('subscription.monthly') }}
        </button>
        <button
          @click="setBillingCycle('yearly')"
          :class="[
            'px-4 py-2 rounded-md transition-all flex items-center gap-2',
            props.billingCycle === 'yearly'
              ? 'bg-white text-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          {{ $t('subscription.yearly') }}
          <Tag severity="success" :value="$t('subscription.save_25')" />
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div v-for="plan in props.plans" :key="plan.type" class="flex flex-col">
        <div
          class="text-center text-sm font-semibold py-2.5 rounded-t-lg"
          :class="plan.popular ? 'bg-emerald-600 text-white' : 'invisible'"
        >
          {{ $t('subscription.most_popular') }}
        </div>
        <div
          class="rounded-lg hover:shadow-md transition-shadow flex flex-col flex-1"
          :class="{ 'rounded-t-none': plan.popular }"
          :style="{
            backgroundColor: planStyles[plan.type].bg,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: planStyles[plan.type].border,
            boxShadow: `0 2px 8px ${planStyles[plan.type].shadow}`,
          }"
        >
        <div class="p-6 flex-1 flex flex-col">
        <div class="flex-1">
          <h3 class="text-xl font-bold mb-2">{{ plan.name }}</h3>
          <p class="text-gray-600 mb-4">{{ plan.description }}</p>

          <div class="mb-4">
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold">${{ getPlanPrice(plan) }}</span>
              <span class="text-gray-600">/{{ $t('subscription.month') }}</span>
            </div>
            <div class="text-sm mt-1" :class="plan.allowsExtraUsers ? 'text-gray-500' : 'invisible'">
              + ${{ plan.allowsExtraUsers ? getExtraUserPrice(plan) : 0 }}
              {{ $t('subscription.per_extra_user') }}
            </div>
          </div>

          <div class="space-y-2 mb-6 pb-6 border-b">
            <div class="flex justify-between text-sm">
              <span>{{ $t('subscription.users') }}:</span>
              <strong>{{ formatLimit(plan.maxUsers) }}</strong>
            </div>
            <div class="flex justify-between text-sm">
              <span>{{ $t('subscription.contacts') }}:</span>
              <strong>{{ formatLimit(plan.maxContacts) }}</strong>
            </div>
            <div class="flex justify-between text-sm">
              <span>{{ $t('subscription.whatsapp_numbers') }}:</span>
              <strong>{{ formatLimit(plan.maxWhatsappNumbers) }}</strong>
            </div>
          </div>

          <div class="space-y-2 mb-6">
            <p v-if="plan.previousPlanName" class="font-bold text-base mb-1">
              {{ $t('subscription.everything_in_plan', { plan: plan.previousPlanName }) }}
            </p>
            <div v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
              <IconCheck class="text-green-500 mt-0.5" size="16" />
              <span class="text-sm">{{ $t(feature) }}</span>
            </div>
          </div>
        </div>

        <Button @click="selectPlan(plan)" class="w-full" :label="$t('subscription.select_plan')" />
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
