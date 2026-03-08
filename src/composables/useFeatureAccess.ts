import { useSessionStore } from '~/stores/session'
import { useSubscriptionStore } from '~/stores/subscription'
import type { PlanType } from '~/types'

const planFeatures: Record<string, string[]> = {
  growth: ['basic_chatbot', 'message_analytics', 'multi_agent_chat', 'bulk_messaging'],
  scale: [
    'basic_chatbot',
    'advanced_chatbot',
    'message_analytics',
    'user_analytics',
    'multi_agent_chat',
    'bulk_messaging',
    'roles_permissions',
  ],
  pro: [
    'basic_chatbot',
    'advanced_chatbot',
    'message_analytics',
    'user_analytics',
    'multi_agent_chat',
    'bulk_messaging',
    'roles_permissions',
    'custom_integrations',
  ],
}

function minimumPlanFor(feature: string): PlanType {
  if (['advanced_chatbot', 'user_analytics', 'roles_permissions'].includes(feature)) return 'scale'
  if (feature === 'custom_integrations') return 'pro'
  return 'growth'
}

export function useFeatureAccess() {
  const sessionStore = useSessionStore()
  const subscriptionStore = useSubscriptionStore()

  function hasActiveSubscription(): boolean {
    return !!sessionStore.subscription
  }

  function requireSubscription(): boolean {
    if (hasActiveSubscription()) return true

    subscriptionStore.showUpgradeModal({
      messageCode: 'no_active_subscription',
    })

    return false
  }

  function hasFeature(feature: string): boolean {
    const plan = sessionStore.subscription?.plan_type
    if (!plan) return false
    return planFeatures[plan]?.includes(feature) ?? false
  }

  function requireFeature(feature: string): boolean {
    if (hasFeature(feature)) return true

    subscriptionStore.showUpgradeModal({
      messageCode: 'feature_not_available',
      feature,
      currentPlan: sessionStore.subscription?.plan_type,
      requiredPlan: minimumPlanFor(feature),
    })

    return false
  }

  return { hasActiveSubscription, requireSubscription, hasFeature, requireFeature }
}
