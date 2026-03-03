<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { IconLoader2 } from '@tabler/icons-vue'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import axios from 'axios'

const props = defineProps<{
  visible: boolean
  wabaId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'connected'): void
}>()

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const loading = ref(false)
const connecting = ref(false)
const availableNumbers = ref<Array<{ id: string; display_phone_number: string; verified_name: string }>>([])
const selectedNumberId = ref<string | null>(null)

const fetchAvailableNumbers = async () => {
  loading.value = true
  selectedNumberId.value = null
  try {
    const response = await API.phoneNumber.available(props.wabaId)
    availableNumbers.value = response.data.data
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (value) => {
    if (value) {
      fetchAvailableNumbers()
    }
  },
)

const onConnect = async () => {
  if (!selectedNumberId.value) return
  connecting.value = true
  try {
    await API.phoneNumber.connect(props.wabaId, selectedNumberId.value)
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('whatsapp_settings.number_connected'),
      life: 3000,
    })
    emit('update:visible', false)
    emit('connected')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('whatsapp_settings.subscription_limit_reached'),
        life: 5000,
      })
    } else {
      handleError(error)
    }
  } finally {
    connecting.value = false
  }
}

const onClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="onClose"
    modal
    :draggable="false"
    :header="$t('whatsapp_settings.add_number_title')"
    class="min-w-[30rem]"
  >
    <div v-if="loading" class="flex justify-center py-8">
      <IconLoader2 class="animate-spin text-slate-400" size="24" />
    </div>

    <div v-else-if="availableNumbers.length === 0" class="text-center text-slate-500 py-8">
      {{ $t('whatsapp_settings.no_available_numbers') }}
    </div>

    <div v-else class="flex flex-col gap-2">
      <div
        v-for="number in availableNumbers"
        :key="number.id"
        class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition"
        @click="selectedNumberId = number.id"
      >
        <RadioButton
          :modelValue="selectedNumberId"
          :value="number.id"
          name="phone_number"
        />
        <div class="flex flex-col">
          <span class="font-medium">{{ number.display_phone_number }}</span>
          <span class="text-sm text-slate-500">{{ number.verified_name }}</span>
        </div>
      </div>
      <div class="flex justify-end mt-4">
        <Button
          :label="$t('whatsapp_settings.connect_waba')"
          :disabled="!selectedNumberId"
          :loading="connecting"
          @click="onConnect"
        />
      </div>
    </div>
  </Dialog>
</template>
