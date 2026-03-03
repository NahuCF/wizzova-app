<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft } from '@tabler/icons-vue'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import type { WABANumber } from '~/types'
import PhoneNumbersTab from '~/components/whatsapp-settings/PhoneNumbersTab.vue'

const route = useRoute()
const router = useRouter()
const handleError = useErrorHandler()

const wabaId = route.params.wabaId as string
const phoneNumbers = ref<WABANumber[]>([])
const loading = ref(false)

const fetchPhoneNumbers = async () => {
  loading.value = true
  try {
    const response = await API.phoneNumber.index(wabaId)
    phoneNumbers.value = response.data.data
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPhoneNumbers()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center gap-3 px-6 pt-6">
      <Button
        variant="text"
        severity="secondary"
        rounded
        @click="router.push('/settings/whatsapp')"
      >
        <IconArrowLeft size="20" />
      </Button>
      <div class="text-2xl font-semibold">{{ $t('whatsapp_settings.detail_title') }}</div>
    </div>

    <div class="px-6 py-8">
      <PhoneNumbersTab
        :phoneNumbers="phoneNumbers"
        :loading="loading"
        :wabaId="wabaId"
        @refresh="fetchPhoneNumbers"
      />
    </div>
  </div>
</template>
