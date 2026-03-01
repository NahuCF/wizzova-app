<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BillingCycle } from '~/types'

interface Plan {
  type: string
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
}

const props = defineProps<{
  selectedPlan: Plan
  billingCycle: BillingCycle
  extraUsers: number
}>()

const emit = defineEmits<{
  'update:extraUsers': [value: number]
}>()

const { t } = useI18n()

const isYearly = computed(() => props.billingCycle === 'yearly')

const getPlanPrice = (plan: Plan) => {
  return isYearly.value ? plan.yearlyPrice : plan.monthlyPrice
}

const getExtraUserPrice = (plan: Plan) => {
  return plan.extraUserPrice
}

const subtotal = computed(() => {
  const basePrice = getPlanPrice(props.selectedPlan)
  const extraUsersPrice = props.extraUsers * getExtraUserPrice(props.selectedPlan)
  return basePrice + extraUsersPrice
})

const totalPrice = computed(() => subtotal.value)

const updateExtraUsers = (value: number) => {
  emit('update:extraUsers', value)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <Card>
        <template #content>
          <h3 class="text-lg font-bold mb-4">{{ $t('subscription.configure_plan') }}</h3>

          <div class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">{{ selectedPlan.name }}</h4>
                <span class="text-xl font-bold"
                  >${{ getPlanPrice(selectedPlan) }}/{{ $t('subscription.month') }}</span
                >
              </div>
              <p class="text-sm text-gray-600">{{ selectedPlan.description }}</p>
            </div>

            <div v-if="selectedPlan.allowsExtraUsers" class="space-y-2">
              <label class="font-semibold">{{ $t('subscription.extra_users') }}</label>
              <div class="flex items-center gap-4">
                <InputNumber
                  :model-value="extraUsers"
                  @update:model-value="updateExtraUsers"
                  :min="0"
                  :max="100"
                  showButtons
                  :pt="{
                    root: { class: 'w-32' },
                  }"
                />
                <span class="text-sm text-gray-600">
                  ${{ getExtraUserPrice(selectedPlan) }}
                  {{ $t('subscription.per_user_month') }}
                </span>
              </div>
              <div v-if="extraUsers > 0" class="text-sm text-gray-500">
                {{ $t('subscription.extra_users_cost') }}: ${{
                  extraUsers * getExtraUserPrice(selectedPlan)
                }}/{{ $t('subscription.month') }}
              </div>
            </div>

            <div v-else class="bg-amber-50 p-4 rounded-lg">
              <p class="text-sm text-amber-800">
                {{ $t('subscription.plan_no_extra_users') }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div>
      <Card>
        <template #title>
          <h3 class="text-lg font-bold">{{ $t('subscription.order_summary') }}</h3>
        </template>
        <template #content>
          <div class="space-y-3">
            <div class="flex justify-between">
              <div>
                <div class="font-medium">{{ selectedPlan.name }}</div>
                <div class="text-sm text-gray-600">
                  {{
                    isYearly
                      ? $t('subscription.yearly_billing')
                      : $t('subscription.monthly_billing')
                  }}
                </div>
              </div>
              <span class="font-medium">${{ getPlanPrice(selectedPlan) }}</span>
            </div>

            <div v-if="extraUsers > 0" class="flex justify-between">
              <div>
                <div class="font-medium">{{ $t('subscription.extra_users') }}</div>
                <div class="text-sm text-gray-600">
                  {{ extraUsers }} x ${{ getExtraUserPrice(selectedPlan) }}
                </div>
              </div>
              <span class="font-medium">${{ extraUsers * getExtraUserPrice(selectedPlan) }}</span>
            </div>

            <Divider />

            <div class="flex justify-between text-lg font-bold">
              <span>{{ $t('subscription.total') }}</span>
              <span>${{ totalPrice }}/{{ $t('subscription.month') }}</span>
            </div>

            <div v-if="isYearly" class="bg-green-50 p-3 rounded-lg">
              <p class="text-sm text-green-800">
                {{ $t('subscription.yearly_savings_message') }}
              </p>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
