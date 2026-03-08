<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconArrowLeft } from '@tabler/icons-vue'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useSessionStore } from '~/stores'
import type { WABANumber } from '~/types'
import PhoneNumbersTab from '~/components/whatsapp-settings/PhoneNumbersTab.vue'

const route = useRoute()
const router = useRouter()
const handleError = useErrorHandler()
const sessionStore = useSessionStore()

const wabaId = route.params.wabaId as string
const phoneNumbers = ref<WABANumber[]>([])
const loading = ref(false)

const wabaName = computed(() => {
  return sessionStore.user?.wabas?.find((w) => w.id === wabaId)?.name ?? ''
})

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
    <div class="flex items-center gap-2 px-6 pt-6">
      <Button
        class="p-1!"
        variant="text"
        severity="secondary"
        @click="router.push('/settings/whatsapp')"
      >
        <IconArrowLeft size="22" />
      </Button>
      <h1 class="font-semibold text-2xl">{{ wabaName }}</h1>
    </div>

    <div class="px-6 py-8">
      <PhoneNumbersTab
        :phoneNumbers="phoneNumbers"
        :loading="loading"
        :wabaId="wabaId"
        disableRowClick
        @refresh="fetchPhoneNumbers"
      />
    </div>
  </div>
</template>
