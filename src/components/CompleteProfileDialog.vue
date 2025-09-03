<script setup lang="ts">
import { IconArrowRight, IconLoader2 } from '@tabler/icons-vue'
import { onMounted, ref, watch } from 'vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useFacebookLogin } from '~/composables/useFacebookLogin'
import router from '~/router'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import type { WABANumber, BusinessItem, WABAItem } from '~/types'

defineProps<{
    visible: boolean
}>()

const sessionStore = useSessionStore()
const handleError = useErrorHandler()

const step = ref(1)
const loading = ref(false)
const selectedBusiness = ref<BusinessItem | null>(null)
const selectedWaba = ref<WABAItem | null>(null)
const selectedWabaNumber = ref<WABANumber | null>(null)
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

const selectDefaultWaba = async () => {
	if (!selectedBusiness.value || !selectedWaba.value || !sessionStore.user) return
	try {
		loading.value = true
		const { data: response } = await API.tenant.storeDefaultWABA(selectedBusiness.value.id, selectedWaba.value.id)
		sessionStore.user.business = selectedBusiness.value
		sessionStore.user.default_waba = selectedWaba.value
		sessionStore.user.wabas = wabas.value
		sessionStore.wabaNumbers = response.data
		
		if(sessionStore.wabaNumbers.length > 0) {
			step.value = 3
		}
		else {
			sessionStore.createNumber = true
		}
	} catch (error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

const selectWABANumber = async () => {
	if (!sessionStore.tenant || !selectedWabaNumber.value || !sessionStore.user) return

	try {
		loading.value = true

		const { data: response } = await API.tenant.selectWABANumber(selectedWabaNumber.value.id)
		sessionStore.user.default_phone_id = response.data.id
		sessionStore.tenant = response.meta.tenant

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
			<div class="flex flex-col py-6 px-12">
				<div class="flex justify-center pb-32">
					<Stepper :value="step" class="w-full" linear>
						<StepList class="text-xl">
							<Step :value="1">{{ $t('complete_profile.connect_account') }}</Step>
							<Step :value="2">{{ $t('complete_profile.select_account') }}</Step>
							<Step :value="3">{{ $t('complete_profile.connect_your_number') }}</Step>
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
							<Button 
								class="font-medium"
								:disabled="loading"
								:loading="loading"
								@click="connectWaba"
							>
								<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
								<span v-else>{{ $t('complete_profile.connect') }}</span>
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
						<div class="flex flex-col gap-1 justify-center w-full px-12">
							<label class="text-lg" for="business">{{ $t('business') }}</label>
							<Select
								v-model="selectedBusiness"
								:options="businesses"
								optionLabel="name"
								:placeholder="$t('complete_profile.select_business')"
								class="w-full"
								name="business"
								id="business"
							/>
						</div>
						<div class="flex flex-col gap-1 justify-center w-full px-12">
							<label class="text-lg" for="waba">{{ $t('users.waba.label') }}</label>
							<Select
								:disabled="wabas.length === 0"
								v-model="selectedWaba"
								:options="wabas"
								optionLabel="name"
								:placeholder="$t('complete_profile.select_account')"
								class="w-full"
								name="waba"
								id="waba"
							/>
						</div>
					</div>

					<div class="flex justify-end w-full">
						<Button
							class="font-medium"
							:disabled="!selectedWaba || loading"
							@click="selectDefaultWaba"
						>
							
							<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
							<span v-else class="flex items-center gap-1">
								{{ $t('next') }}
								<IconArrowRight size="16" />
							</span>
						</Button>
					</div>
				</div>

				<div v-if="step === 3" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-8 max-w-[400px] w-full">
						<h3 class="text-4xl font-semibold text-center mb-12">
							{{ $t('complete_profile.connect_your_number') }}
						</h3>
						<div class="flex flex-col items-center gap-8 w-full px-12">
							<div class="flex flex-col gap-1 justify-center w-full">
								<label class="text-lg" for="wabaNumbers">{{ $t('complete_profile.phone_number') }}</label>
								<Select
									v-model="selectedWabaNumber"
									:options="sessionStore.wabaNumbers"
									optionLabel="display_phone_number"
									:placeholder="$t('complete_profile.select_number')"
									class="w-full"
									name="wabaNumbers"
									id="wabaNumbers"
								/>
							</div>
							<div class="w-full">
								<Divider layout="horizontal" align="center" class="font-medium">OR</Divider>
							</div>
							<div class="flex flex-col gap-1 justify-center w-full">
								<Button
									class="text-lg font-medium"
									@click="sessionStore.createNumber = true"
								>
									{{ $t('complete_profile.connect_new_number') }}
								</Button>
							</div>
						</div>
					</div>

					<div class="flex justify-end w-full">
						<Button
							class="font-medium"
							:disabled="!selectedWabaNumber || loading"
							@click="selectWABANumber"
						>
							
							<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
							<span v-else class="flex items-center">
								{{ $t('complete_profile.connect_number') }}
							</span>
						</Button>
					</div>
				</div>
			</div>
		</template>
	</Dialog>
</template>