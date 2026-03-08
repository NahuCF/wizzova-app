<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { IconBrandWhatsapp, IconEdit, IconLoader2, IconArrowLeft } from '@tabler/icons-vue'
import { API } from '~/services'
import { useFacebookLogin } from '~/composables/useFacebookLogin'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useFeatureAccess } from '~/composables/useFeatureAccess'
import type { WABAItem, BusinessItem, Column } from '~/types'

const { t } = useI18n()
const router = useRouter()
const toast = useToast()
const handleError = useErrorHandler()
const { requireSubscription } = useFeatureAccess()
const { initialize, launchLogin } = useFacebookLogin()

const wabas = ref<WABAItem[]>([])
const loading = ref(false)
const connecting = ref(false)

const connectStep = ref<'idle' | 'businesses' | 'wabas'>('idle')
const businesses = ref<BusinessItem[]>([])
const selectedBusiness = ref<BusinessItem | null>(null)
const selectedWaba = ref<WABAItem | null>(null)
const showConnectDialog = ref(false)
const connectingWaba = ref(false)

const columns = computed<Column[]>(() => [
  { header: t('whatsapp_settings.headers.name'), key: 'name' },
  { header: t('whatsapp_settings.headers.business_name'), key: 'business_name' },
  { header: t('whatsapp_settings.headers.phone_numbers'), key: 'phone_numbers_count' },
  { header: '', key: 'actions', type: 'ACTIONS', bodyStyle: { maxWidth: '50px' } },
])

const wabaActions = (waba: WABAItem) => {
  return [
    [
      {
        label: t('whatsapp_settings.edit'),
        icon: IconEdit,
        action: () => router.push(`/settings/whatsapp/${waba.id}`),
      },
    ],
  ]
}

const transformedWabas = computed(() => {
  return wabas.value.map((waba) => ({
    ...waba,
    actions: wabaActions,
  }))
})

const fetchWabas = async () => {
  loading.value = true
  try {
    const response = await API.waba.index()
    wabas.value = response.data.data
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

const onConnect = async () => {
  if (!requireSubscription()) return
  connecting.value = true
  try {
    const appIdResponse = await API.meta.getAppId()
    await initialize(appIdResponse.data.app_id)

    const authResponse = await launchLogin(
      'whatsapp_business_management,whatsapp_business_messaging,business_management',
    )

    const accessToken =
      typeof authResponse === 'object' && 'accessToken' in authResponse
        ? authResponse.accessToken
        : ''

    const businessesResponse = await API.tenant.getBusinesses(accessToken)
    businesses.value = businessesResponse.data.data
    connectStep.value = 'businesses'
    selectedBusiness.value = null
    selectedWaba.value = null
    showConnectDialog.value = true
  } catch (error) {
    handleError(error)
  } finally {
    connecting.value = false
  }
}

const onNextStep = () => {
  if (!selectedBusiness.value) return
  connectStep.value = 'wabas'
  selectedWaba.value = null
}

const onBackStep = () => {
  connectStep.value = 'businesses'
  selectedWaba.value = null
}

const onConnectWaba = async () => {
  if (!selectedWaba.value) return
  connectingWaba.value = true
  try {
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('whatsapp_settings.connected_successfully'),
      life: 3000,
    })
    showConnectDialog.value = false
    connectStep.value = 'idle'
    selectedBusiness.value = null
    selectedWaba.value = null
    await fetchWabas()
  } catch (error) {
    handleError(error)
  } finally {
    connectingWaba.value = false
  }
}

const onCloseDialog = () => {
  showConnectDialog.value = false
  connectStep.value = 'idle'
  selectedBusiness.value = null
  selectedWaba.value = null
}

const onRowClick = (event: { data: WABAItem }) => {
  router.push(`/settings/whatsapp/${event.data.id}`)
}

onMounted(() => {
  fetchWabas()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between px-6 pt-6">
      <div class="text-2xl font-semibold">{{ $t('whatsapp_settings.title') }}</div>
      <Button @click="onConnect" :disabled="connecting">
        <IconLoader2 v-if="connecting" class="animate-spin mr-1" size="16" />
        <IconBrandWhatsapp v-else size="16" class="mr-1" />
        <span>{{ $t('whatsapp_settings.connect') }}</span>
      </Button>
    </div>

    <div class="px-6 py-8">
      <Table
        :data="transformedWabas"
        :columns="columns"
        :loading="loading"
        :hoverable="true"
        emptyMessage="whatsapp_settings.empty"
        @onRowClick="onRowClick"
      />
    </div>

    <Dialog
      :visible="showConnectDialog"
      @update:visible="onCloseDialog"
      modal
      :draggable="false"
      :header="
        connectStep === 'businesses'
          ? $t('whatsapp_settings.select_business')
          : $t('whatsapp_settings.select_waba')
      "
      class="min-w-[30rem]"
    >
      <div v-if="connectStep === 'businesses'" class="flex flex-col gap-2">
        <div
          v-for="business in businesses"
          :key="business.id"
          class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition"
          @click="selectedBusiness = business"
        >
          <RadioButton
            :modelValue="selectedBusiness?.id"
            :value="business.id"
            name="business"
          />
          <div class="flex flex-col">
            <span class="font-medium">{{ business.name }}</span>
            <span class="text-sm text-slate-500">
              {{ business.wabas?.length || 0 }} {{ $t('whatsapp_settings.wabas_count') }}
            </span>
          </div>
        </div>
        <div v-if="businesses.length === 0" class="text-center text-slate-500 py-4">
          {{ $t('whatsapp_settings.no_businesses') }}
        </div>
        <div class="flex justify-end mt-4">
          <Button
            :label="$t('whatsapp_settings.next')"
            :disabled="!selectedBusiness"
            @click="onNextStep"
          />
        </div>
      </div>

      <div v-if="connectStep === 'wabas'" class="flex flex-col gap-2">
        <Button
          variant="text"
          severity="secondary"
          class="mb-2 self-start"
          @click="onBackStep"
        >
          <IconArrowLeft size="16" class="mr-1" />
          {{ $t('back') }}
        </Button>
        <div
          v-for="waba in selectedBusiness?.wabas || []"
          :key="waba.id"
          class="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition"
          @click="selectedWaba = waba"
        >
          <RadioButton
            :modelValue="selectedWaba?.id"
            :value="waba.id"
            name="waba"
          />
          <div class="flex flex-col">
            <span class="font-medium">{{ waba.name }}</span>
            <span v-if="waba.currency" class="text-sm text-slate-500">
              {{ $t('whatsapp_settings.currency') }}: {{ waba.currency }}
            </span>
          </div>
        </div>
        <div v-if="!selectedBusiness?.wabas?.length" class="text-center text-slate-500 py-4">
          {{ $t('whatsapp_settings.no_wabas') }}
        </div>
        <div class="flex justify-end mt-4">
          <Button
            :label="$t('whatsapp_settings.connect_waba')"
            :disabled="!selectedWaba"
            :loading="connectingWaba"
            @click="onConnectWaba"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>
