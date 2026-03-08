import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export interface UpgradeModalData {
  messageCode: string
  feature?: string
  currentPlan?: string
  requiredPlan?: string
  limit?: number | null
  used?: number | null
}

export const useSubscriptionStore = defineStore('subscription', () => {
  const router = useRouter()

  const upgradeModalVisible = ref(false)
  const upgradeModalData = ref<UpgradeModalData | null>(null)

  function showUpgradeModal(data: UpgradeModalData) {
    upgradeModalData.value = data
    upgradeModalVisible.value = true
  }

  function hideUpgradeModal() {
    upgradeModalVisible.value = false
    upgradeModalData.value = null
  }

  function redirectToUpgrade() {
    hideUpgradeModal()
    router.push({ path: '/subscription', query: { upgrade: 'true' } })
  }

  const $reset = () => {
    upgradeModalVisible.value = false
    upgradeModalData.value = null
  }

  return {
    upgradeModalVisible,
    upgradeModalData,
    showUpgradeModal,
    hideUpgradeModal,
    redirectToUpgrade,
    $reset,
  }
})
