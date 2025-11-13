<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconCheck, IconLoader2 } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
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
}

const props = defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    'update:visible': [value: boolean]
}>()

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const currentStep = ref(1)
const loading = ref(false)
const billingCycle = ref<BillingCycle>('monthly')
const selectedPlan = ref<Plan | null>(null)
const extraUsers = ref(0)

const plans: Plan[] = [
    {
        type: 'growth',
        name: 'Growth',
        description: t('subscription.growth_description'),
        monthlyPrice: 39,
        yearlyPrice: 29,
        maxUsers: 3,
        maxContacts: 5000,
        maxWhatsappNumbers: 1,
        extraUserPrice: 0,
        allowsExtraUsers: false,
        features: [
            'subscription.basic_chatbot',
            'subscription.message_analytics',
            'subscription.multi_agent_chat',
            'subscription.bulk_messaging'
        ]
    },
    {
        type: 'scale',
        name: 'Scale',
        description: t('subscription.scale_description'),
        monthlyPrice: 79,
        yearlyPrice: 59,
        maxUsers: 5,
        maxContacts: 10000,
        maxWhatsappNumbers: 2,
        extraUserPrice: 15,
        allowsExtraUsers: true,
        features: [
            'subscription.basic_chatbot',
            'subscription.advanced_chatbot',
            'subscription.message_analytics',
            'subscription.user_analytics',
            'subscription.multi_agent_chat',
            'subscription.bulk_messaging',
            'subscription.roles_permissions'
        ]
    },
    {
        type: 'pro',
        name: 'Pro',
        description: t('subscription.pro_description'),
        monthlyPrice: 199,
        yearlyPrice: 149,
        maxUsers: null,
        maxContacts: null,
        maxWhatsappNumbers: null,
        extraUserPrice: 35,
        allowsExtraUsers: true,
        features: [
            'subscription.basic_chatbot',
            'subscription.advanced_chatbot',
            'subscription.message_analytics',
            'subscription.user_analytics',
            'subscription.multi_agent_chat',
            'subscription.bulk_messaging',
            'subscription.roles_permissions',
            'subscription.custom_integrations',
            'subscription.priority_support'
        ]
    }
]

const isYearly = computed(() => billingCycle.value === 'yearly')

const getPlanPrice = (plan: Plan) => {
    return isYearly.value ? plan.yearlyPrice : plan.monthlyPrice
}

const getExtraUserPrice = (plan: Plan) => {
    return plan.extraUserPrice
}

const subtotal = computed(() => {
    if (!selectedPlan.value) return 0
    const basePrice = getPlanPrice(selectedPlan.value)
    const extraUsersPrice = extraUsers.value * getExtraUserPrice(selectedPlan.value)
    return basePrice + extraUsersPrice
})

const totalPrice = computed(() => subtotal.value)

const selectPlan = (plan: Plan) => {
    selectedPlan.value = plan
    currentStep.value = 2
    extraUsers.value = 0
}

const goBack = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const closeModal = () => {
    currentStep.value = 1
    selectedPlan.value = null
    extraUsers.value = 0
    emit('update:visible', false)
}

const subscribe = async () => {
    if (!selectedPlan.value) return
    
    loading.value = true
    try {
        const { data: response } = await API.subscription.generateMercadoPagoLink({
            plan_type: selectedPlan.value.type,
            billing_cycle: billingCycle.value,
            extra_users: extraUsers.value
        })
        
        // Redirect to MercadoPago
        window.location.href = response.data.link
        closeModal()
    } catch(error) {
        handleError(error)
    } finally {
        loading.value = false
    }
}

const formatLimit = (value: number | null, suffix?: string) => {
    if (value === null) return t('subscription.unlimited')
    return suffix ? `${value} ${suffix}` : value.toString()
}
</script>

<template>
    <Dialog 
        v-model:visible="props.visible"
        @update:visible="emit('update:visible', $event)"
        modal
        :closable="!loading"
        :style="{ width: '90vw', maxWidth: '1200px' }"
    >
        <template #header>
            <div class="flex flex-col gap-2 w-full">
                <h2 class="text-2xl font-bold">{{ $t('subscription.choose_plan') }}</h2>
                <Stepper v-model:value="currentStep" linear>
                    <StepList>
                        <Step :value="1">{{ $t('subscription.select_plan') }}</Step>
                        <Step :value="2">{{ $t('subscription.configure_users') }}</Step>
                    </StepList>
                </Stepper>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <!-- Step 1: Plan Selection -->
            <div v-if="currentStep === 1">
                <!-- Billing Toggle -->
                <div class="flex justify-center mb-6">
                    <div class="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                        <button
                            @click="billingCycle = 'monthly'"
                            :class="[
                                'px-4 py-2 rounded-md transition-all',
                                billingCycle === 'monthly' 
                                    ? 'bg-white text-primary shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-800'
                            ]"
                        >
                            {{ $t('subscription.monthly') }}
                        </button>
                        <button
                            @click="billingCycle = 'yearly'"
                            :class="[
                                'px-4 py-2 rounded-md transition-all flex items-center gap-2',
                                billingCycle === 'yearly' 
                                    ? 'bg-white text-primary shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-800'
                            ]"
                        >
                            {{ $t('subscription.yearly') }}
                            <Tag severity="success" :value="$t('subscription.save_25')" />
                        </button>
                    </div>
                </div>

                <!-- Plans Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div 
                        v-for="plan in plans" 
                        :key="plan.type"
                        class="border rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col"
                    >
                        <div class="flex-1">
                            <h3 class="text-xl font-bold mb-2">{{ plan.name }}</h3>
                            <p class="text-gray-600 mb-4">{{ plan.description }}</p>
                            
                            <div class="mb-4">
                                <div class="flex items-baseline gap-1">
                                    <span class="text-3xl font-bold">${{ getPlanPrice(plan) }}</span>
                                    <span class="text-gray-600">/{{ $t('subscription.month') }}</span>
                                </div>
                                <div v-if="plan.allowsExtraUsers" class="text-sm text-gray-500 mt-1">
                                    + ${{ getExtraUserPrice(plan) }} {{ $t('subscription.per_extra_user') }}
                                </div>
                            </div>

                            <!-- Plan Limits -->
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

                            <!-- Features -->
                            <div class="space-y-2 mb-6">
                                <div v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
                                    <IconCheck class="text-green-500 mt-0.5" size="16" />
                                    <span class="text-sm">{{ $t(feature) }}</span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            @click="selectPlan(plan)"
                            class="w-full"
                            :label="$t('subscription.select_plan')"
                        />
                    </div>
                </div>
            </div>

            <!-- Step 2: User Configuration -->
            <div v-else-if="currentStep === 2 && selectedPlan">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Configuration Panel -->
                    <div class="lg:col-span-2">
                        <Card>
                            <template #content>
                                <h3 class="text-lg font-bold mb-4">{{ $t('subscription.configure_plan') }}</h3>
                                
                                <div class="space-y-4">
                                    <!-- Selected Plan Info -->
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <div class="flex justify-between items-center mb-2">
                                            <h4 class="font-semibold">{{ selectedPlan.name }}</h4>
                                            <span class="text-xl font-bold">${{ getPlanPrice(selectedPlan) }}/{{ $t('subscription.month') }}</span>
                                        </div>
                                        <p class="text-sm text-gray-600">{{ selectedPlan.description }}</p>
                                    </div>

                                    <!-- Extra Users -->
                                    <div v-if="selectedPlan.allowsExtraUsers" class="space-y-2">
                                        <label class="font-semibold">{{ $t('subscription.extra_users') }}</label>
                                        <div class="flex items-center gap-4">
                                            <InputNumber 
                                                v-model="extraUsers" 
                                                :min="0" 
                                                :max="100"
                                                showButtons
                                                :pt="{
                                                    root: { class: 'w-32' }
                                                }"
                                            />
                                            <span class="text-sm text-gray-600">
                                                ${{ getExtraUserPrice(selectedPlan) }} {{ $t('subscription.per_user_month') }}
                                            </span>
                                        </div>
                                        <div v-if="extraUsers > 0" class="text-sm text-gray-500">
                                            {{ $t('subscription.extra_users_cost') }}: ${{ extraUsers * getExtraUserPrice(selectedPlan) }}/{{ $t('subscription.month') }}
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

                    <!-- Order Summary -->
                    <div>
                        <Card>
                            <template #title>
                                <h3 class="text-lg font-bold">{{ $t('subscription.order_summary') }}</h3>
                            </template>
                            <template #content>
                                <div class="space-y-3">
                                    <!-- Base Plan -->
                                    <div class="flex justify-between">
                                        <div>
                                            <div class="font-medium">{{ selectedPlan.name }}</div>
                                            <div class="text-sm text-gray-600">
                                                {{ isYearly ? $t('subscription.yearly_billing') : $t('subscription.monthly_billing') }}
                                            </div>
                                        </div>
                                        <span class="font-medium">${{ getPlanPrice(selectedPlan) }}</span>
                                    </div>

                                    <!-- Extra Users -->
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

                                    <!-- Total -->
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

                        <Button 
                            @click="subscribe"
                            class="w-full mt-4"
                            :label="$t('subscription.subscribe')"
                            :loading="loading"
                            :disabled="loading"
                        >
                            <template #icon>
                                <IconLoader2 v-if="loading" class="animate-spin" />
                            </template>
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between">
                <Button 
                    v-if="currentStep > 1"
                    @click="goBack"
                    :label="$t('back')"
                    severity="secondary"
                    :disabled="loading"
                />
                <div v-else></div>
                <Button 
                    @click="closeModal"
                    :label="$t('cancel')"
                    severity="secondary"
                    :disabled="loading"
                />
            </div>
        </template>
    </Dialog>
</template>