<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconLoader2, IconArrowRight, IconPhone, 
	IconTrash, IconAsterisk, IconExternalLink } from '@tabler/icons-vue'
import { useCountryStore, useSessionStore } from '~/stores'
import parsePhoneNumberFromString, { type CountryCode } from 'libphonenumber-js/min'
import { z } from 'zod'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import type { WABANumber } from '~/types'
import { useRouter } from 'vue-router'

const props = defineProps<{
    visible: boolean
}>()

const sessionStore = useSessionStore()
const countryStore = useCountryStore()
const handleError = useErrorHandler()
const router = useRouter()

const step = ref(1)
const loading = ref(false)
const canConnect = ref(false)
const phoneForm = ref<{
	businessName: string,
	phone: string,
	countryCode: CountryCode
}>({
	businessName: sessionStore.user?.business?.name ?? '',
	phone: '',
	countryCode: 'US'
})
const errors = ref<
	z.ZodFormattedError<{
		businessName: string;
		phone: string;
	}, string>
>()
const newWabaNumber = ref<WABANumber>()
const verificationCode = ref<string>('')
const validateCodeError = ref(false)

const selectedCountry = computed(() => {
	return countryStore.countryPhones.find(c => c.code === phoneForm.value.countryCode)
})

const phoneSchema = () => z.object({
	businessName: z.string().refine((value) => value.length > 0, {
		message: 'business_name_is_required',
	}),
	phone: z.string().refine(
		(value) => {
			if(!selectedCountry.value) {
				return false
			}

			try {
				const phoneNumber = parsePhoneNumberFromString(selectedCountry.value.prefix + value)
				return phoneNumber?.isValid() ?? false
			} catch {
				return false
			}
		},
		{ message: 'invalid_cellphone' }
	)
})

const validateForm = async () => {
    const result = phoneSchema().safeParse(phoneForm.value)

    errors.value = undefined
    if (!result.success) {
		errors.value = result.error.format()
        return false
    }
	if (!selectedCountry.value) return false

	loading.value = true
	try {
		const { data: response } = await API.tenant.registerWABANumber(
			phoneForm.value.businessName,
			phoneForm.value.phone,
			selectedCountry.value.prefix
		)
		newWabaNumber.value = response.data
		sessionStore.tenant = response.meta.tenant

		step.value = 3
	} catch(error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

const verifyCode = async () => {
	if(!newWabaNumber.value || !sessionStore.tenant || !sessionStore.user) return

	validateCodeError.value = true
	if(verificationCode.value.length < 6) return

	try {
		loading.value = true
		const { data: response } = await API.tenant.verifyNumberCode(newWabaNumber.value.id, verificationCode.value)
		sessionStore.user.default_phone_id = response.data.id
		sessionStore.tenant = response.meta.tenant

		await router.replace({ name: 'templates' })
		window.location.reload()
	} catch(error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

watch(() => props.visible, () => {
	if(props.visible) {
		phoneForm.value = {
			businessName: sessionStore.user?.business?.name ?? '',
			phone: '',
			countryCode: 'US'
		}
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
							<Step :value="1">{{ $t('create_number.requirements') }}</Step>
							<Step :value="2">{{ $t('create_number.connect_number') }}</Step>
							<Step :value="3">{{ $t('create_number.verify') }}</Step>
						</StepList>
					</Stepper>
				</div>

				<div v-if="step === 1" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-8 max-w-[440px]">
						<div class="flex items-center gap-6">
							<div class="flex justify-center items-center min-w-[35px] h-[35px] bg-emerald-200 rounded-sm">
								<IconPhone class="text-emerald-500" size="20" />
							</div>
							<p class="text-lg text-gray-500 font-normal">
								{{ $t('create_number.number_requirements') }}
							</p>
						</div>

						<div class="flex items-center gap-6">
							<div class="flex justify-center items-center min-w-[35px] h-[35px] bg-red-200 rounded-sm">
								<IconTrash class="text-red-600" size="20" />
							</div>
							<p class="text-lg text-gray-500 font-normal">
								{{ $t('create_number.delete_number_required') }}
								<a 
									class="text-sky-600"
									href="https://faq.whatsapp.com/2138577903196467/?cms_platform=android"
									target="_blank"
								>
									{{ $t('learn_more') }}
									<IconExternalLink size="16" class="inline" />
								</a>
							</p>
						</div>

						<div class="flex items-center gap-4 pt-6">
							<Checkbox v-model="canConnect" inputId="canConnect" name="canConnect" size="large" binary />
							<label for="canConnect" class="text-lg text-neutral-800! cursor-pointer"> 
								{{ $t('create_number.can_connect_number') }} 
							</label>
						</div>
					</div>

					<div class="flex justify-end w-full">
						<div class="flex gap-2">
							<Button
								v-if="sessionStore.wabaNumbers.length > 0"
								class="bg-white! border-slate-200! hover:bg-slate-100!"
								severity="secondary"
								:disabled="loading"
								@click="sessionStore.createNumber = false"
							>
								{{ $t('back') }}
							</Button>

							<Button
								class="font-medium"
								:disabled="!canConnect"
								@click="step = 2"
							>
								
								<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
								<span v-else class="flex items-center gap-1">
									{{ $t('next') }}
									<IconArrowRight size="16" />
								</span>
							</Button>
						</div>
					</div>
				</div>

				<div v-if="step === 2" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-12 max-w-[400px] w-full px-12">
						<div class="flex flex-col gap-2 relative w-full">
							<label class="text-lg flex items-center gap-1" for="phone">
								<span class="text-neutral-800">{{ $t(`create_number.whatsapp_business_display_name`) }}</span>
								<IconAsterisk color="red" size="8" />
							</label>

							<InputText 
                                v-model="phoneForm.businessName"
                                class="w-full"
                                :placeholder="$t('create_number.business_name')"
                            />

							<Message 
								v-if="errors?.businessName?._errors"
								severity="error"
								variant="simple"
							>
								{{ $t(errors.businessName._errors[0]) }}
							</Message>
						</div>

						<div class="flex flex-col gap-2 relative w-full">
							<label class="text-lg flex items-center gap-1" for="phone">
								<span class="text-neutral-800">{{ $t(`create_number.select_number`) }}</span>
								<IconAsterisk color="red" size="8" />
							</label>

							<CellphoneInput
								v-model="phoneForm.phone"
								v-model:countryCode="phoneForm.countryCode"
							/>

							<Message 
								v-if="errors?.phone?._errors"
								severity="error"
								variant="simple"
							>
								{{ $t(errors.phone._errors[0]) }}
							</Message>
						</div>
					</div>

					<div class="flex justify-end w-full">
						<div class="flex gap-2">
							<Button
								class="bg-white! border-slate-200! hover:bg-slate-100!"
								severity="secondary"
								:disabled="loading"
								@click="step = 1"
							>
								{{ $t('back') }}
							</Button>

							<Button
								class="font-medium"
								:disabled="loading"
								@click="validateForm"
							>
								
								<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
								<span v-else class="flex items-center gap-1">
									{{ $t('create_number.connect_number') }}
									<IconArrowRight size="16" />
								</span>
							</Button>
						</div>
					</div>
				</div>

				<div v-if="step === 3" class="flex flex-col items-center gap-32 w-full">
					<div class="flex flex-col items-center gap-10 max-w-[400px]">
						<div class="flex flex-col items-center gap-4">
							<h3 class="text-3xl font-semibold text-center">
								{{ $t('create_number.verify_your_phone_number') }}
							</h3>

							<p class="text-lg text-gray-500 font-normal text-center">
								{{ $t('create_number.receive_verification_code') }}
							</p>
						</div>

						<div class="flex flex-col items-center gap-4 relative">
							<label class="text-lg flex items-center gap-1" for="phone">
								<span class="text-neutral-800">{{ $t(`create_number.verification_code`) }}</span>
							</label>

							<InputOtp
                                v-model="verificationCode"
								:length="6"
                                class="w-full flex justify-center"
                            />

							<Message 
								v-if="validateCodeError && verificationCode.length < 6"
								severity="error"
								variant="simple"
							>
								{{ $t('create_number.verication_code_length') }}
							</Message>
						</div>
					</div>

					<div class="flex justify-end w-full">
						<div class="flex gap-2">
							<Button
								class="font-medium"
								:disabled="loading"
								@click="verifyCode"
							>
								
								<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
								<span v-else class="flex items-center gap-1">
									{{ $t('create_number.verify_code') }}
									<IconArrowRight size="16" />
								</span>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</template>
	</Dialog>
</template>