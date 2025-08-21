<script setup lang="ts">
import { useToast } from 'primevue'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useFacebookLogin } from '~/composables/useFacebookLogin'
import router from '~/router'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import type { BusinessItem, WABAItem } from '~/types'

defineProps<{
    visible: boolean
}>()

const sessionStore = useSessionStore()
const toast = useToast()
const { t } = useI18n()
const handleError = useErrorHandler()

const step = ref(1)
const loading = ref(false)
const selectedBusiness = ref<BusinessItem | null>(null)
const selectedWaba = ref<WABAItem | null>(null)
const businesses = ref<BusinessItem[]>([])
const wabas = ref<WABAItem[]>([])

const { initialize, launchLogin } = useFacebookLogin()

const fetchAppId = async () => {
	try {
		const response = await API.meta.getAppId()
		return response.data.app_id
	} catch (error) {
		console.error(error)
	}
}

const connectWaba = async () => {
	try {
		const authResponse = await launchLogin('business_management,whatsapp_business_management,whatsapp_business_messaging,whatsapp_business_manage_events ')
		if (!authResponse) {
			console.error('Failed to get access token')
			return
		}

		loading.value = true
		const { data: response } = await API.tenant.getBusinesses(authResponse.accessToken)
		businesses.value = response.data || []

		step.value = 2
	} catch (error) {
		console.log(error)
	} finally {
		loading.value = false
	}
}

const completeProfile = async () => {
	if (!selectedBusiness.value || !selectedWaba.value || !sessionStore.user) return
	try {
		loading.value = true
		const { data: response} = await API.tenant.completeProfile(selectedBusiness.value.id, selectedWaba.value.id)
		sessionStore.user.business = selectedBusiness.value
		sessionStore.user.default_waba = selectedWaba.value
		sessionStore.user.wabas = wabas.value
		sessionStore.tenant = response.data

		await router.replace({ name: 'templates' })
		window.location.reload()
	} catch (error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

watch(selectedBusiness, () => {
	if(selectedBusiness.value) {
		selectedWaba.value = null
		wabas.value = selectedBusiness.value.wabas || []
	}
	else {
		selectedWaba.value = null
		wabas.value = []
	}
})

onMounted(async () => {
	const appId = await fetchAppId()
	if(appId) {
		await initialize(appId)
	}
})
</script>

<template>
	<Dialog
		:visible="visible"
		:modal="true"
		:closable="false"
		:draggable="false"
	 	pt:mask:class="backdrop-blur-sm"
		class="max-w-[800px] w-full"
	>
		<template #container>
			<div class="flex flex-col p-8">
				<div class="flex justify-center pb-32">
					<Stepper :value="step" class="max-w-[400px] w-full" linear>
						<StepList class="text-xl">
							<Step :value="1">{{ $t('complete_profile.connect_account') }}</Step>
							<Step :value="2">{{ $t('complete_profile.select_account') }}</Step>
						</StepList>
					</Stepper>
				</div>

				<div v-if="step === 1" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-8 max-w-[400px]">
						<h3 class="text-4xl font-semibold text-center">
							{{ $t('complete_profile.connect_account_title') }}
						</h3>
						<p class="text-xl text-center">
							{{ $t('complete_profile.connect_account_description') }}
						</p>
						<div class="flex justify-center">
							<Button @click="connectWaba">
								{{ $t('complete_profile.connect') }}
							</Button>
						</div>
					</div>

					<div class="flex justify-center">
						<Button
							class="bg-white! border-slate-200! hover:bg-slate-100!" 
							severity="secondary" 
						>
							{{ $t('complete_profile.schedule_a_call') }}
						</Button>
					</div>
				</div>

				<div v-if="step === 2" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-8 max-w-[400px]">
						<h3 class="text-4xl font-semibold text-center">
							{{ $t('complete_profile.select_account_title') }}
						</h3>
						<p class="text-xl text-center">
							{{ $t('complete_profile.select_account_description') }}
						</p>
						<div class="flex justify-center w-full">
							<Select
								v-model="selectedBusiness"
								:options="businesses"
								optionLabel="name"
								:placeholder="$t('complete_profile.select_business')"
								class="w-full"
							/>
						</div>
						<div class="flex justify-center w-full">
							<Select
								:disabled="wabas.length === 0"
								v-model="selectedWaba"
								:options="wabas"
								optionLabel="name"
								:placeholder="$t('complete_profile.select_account')"
								class="w-full"
							/>
						</div>
					</div>

					<div class="flex justify-center">
						<Button
							:disabled="!selectedWaba"
							@click="completeProfile"
						>
							{{ $t('complete_profile.complete_profile') }}
						</Button>
					</div>
				</div>
			</div>
		</template>
	</Dialog>
</template>