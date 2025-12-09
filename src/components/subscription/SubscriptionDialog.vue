<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconCreditCard } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import type { PlanType, BillingCycle } from '~/types'
import SubscriptionPlanStep from './SubscriptionPlanStep.vue'
import SubscriptionUserStep from './SubscriptionUserStep.vue'

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

defineProps<{
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
            'subscription.custom_integrations'
        ]
    }
]

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
        
        window.location.href = response.data.link
        closeModal()
    } catch(error) {
        handleError(error)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <Dialog 
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        :closable="!loading"
        :draggable="false"
        :style="{ width: '90vw', maxWidth: '1200px' }"
    >
        <template #header>
            <div class="flex flex-col gap-2 w-full">
                <h2 class="text-2xl font-bold">{{ $t('subscription.choose_plan') }}</h2>
                <div class="flex justify-center">
                    <Stepper v-model:value="currentStep" linear class="w-126">
                        <StepList>
                            <Step :value="1" class="flex-1">{{ $t('subscription.select_plan') }}</Step>
                            <Step :value="2" class="flex-1">{{ $t('subscription.configure_users') }}</Step>
                        </StepList>
                    </Stepper>
                </div>
            </div>
        </template>

        <div class="flex flex-col gap-4">
            <div v-if="currentStep === 1">
                <SubscriptionPlanStep
                    :plans="plans"
                    :billingCycle="billingCycle"
                    @update:billingCycle="billingCycle = $event"
                    @selectPlan="selectPlan"
                />
            </div>

            <div v-else-if="currentStep === 2 && selectedPlan">
                <SubscriptionUserStep
                    :selectedPlan="selectedPlan"
                    :billingCycle="billingCycle"
                    :extraUsers="extraUsers"
                    @update:extraUsers="extraUsers = $event"
                />
            </div>
        </div>

        <template #footer>
            <div class="flex justify-between">
                <div class="flex gap-2">
                     <Button 
                        v-if="currentStep > 1"
                        @click="goBack"
                        :label="$t('back')"
                        severity="secondary"
                        :disabled="loading"
                    />
                    <Button 
                        v-if="currentStep === 2"
                        @click="subscribe"
                        :label="$t('subscription.subscribe')"
                        :loading="loading"
                        :disabled="loading"
                    />
                </div>
            </div>
        </template>
    </Dialog>
</template>