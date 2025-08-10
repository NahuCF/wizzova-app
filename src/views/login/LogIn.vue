<script lang="ts" setup>
import { ref } from 'vue'
import { IconLoader2 } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'vue-router'
import { API } from '~/services/index'
import { useSessionStore } from '~/stores/session'
import { useToast } from 'primevue'
import axios from 'axios'
import type { FormSubmitEvent } from '@primevue/forms'
import { isLoginResponse } from '~/types/guards'
import { storeToRefs } from 'pinia'

const sessionStore = useSessionStore()
const { user, token, tenant, tenants, selectedTenant, savedEmail } = storeToRefs(sessionStore)
const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const loading = ref(false)

const form = ref({
	email: '',
	password: '',
})

const resolver = zodResolver(
	z.object({
		email: z.string().refine(value => value.length > 0, {
			message: 'the_email_is_required',
		}),
		password: z.string().refine(value => value.length > 0, {
			message: 'password_is_required',
		}),
	}),
)

const onFormSubmit = async ({ valid }: FormSubmitEvent) => {
	if (!valid) return

	try {
		loading.value = true
		const { data: response } = await API.auth.login({
			email: form.value.email,
			password: form.value.password,
			...(selectedTenant.value && { tenant_id: selectedTenant.value.id })
		})

		if (!isLoginResponse(response)) {
			tenants.value = response.data
			savedEmail.value = form.value.email
			return router.push('/login/choose-tenant')
		}

		tenant.value = response.data
		user.value = response.meta.user
		token.value = response.meta.token

		router.replace({ name: 'templates' })
	} catch (error) {
		let errorMessage = t('an_error_occurred')

		if (axios.isAxiosError(error) && error.status === 422 && error.response) {
			errorMessage = t('validation_errors.' + error.response.data.message.replace('.', ''))
		}

		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: errorMessage,
			life: 3000,
		})
	} finally {
		loading.value = false
	}
}

if(savedEmail.value) {
	form.value.email = savedEmail.value
}
</script>

<template>
	<div class="flex flex-col w-full h-screen relative">
		<div class="flex absolute right-0 md:block p-3">
			<LanguageSelector class="ml-auto" />
		</div>
		<div class="w-full flex items-center justify-center flex-1">
			<div class="rounded-md bg-white p-16 shadow-md w-full md:w-[38rem] h-screen md:h-auto">
				<h1 class="text-4xl text-center font-bold mb-18 text-neutral-800">
					{{ $t('log_in_to_your_account') }}
				</h1>
				<div v-if="selectedTenant && savedEmail === form.email" class="flex justify-between mb-6">
					<div class="flex flex-col">
						<div class="text-sm text-neutral-800! font-medium">
							{{ $t('login.company').toUpperCase() }}
						</div>
						<div class="text-sm">
							{{ selectedTenant.company_name }}
						</div>
					</div>
					<Button @click="router.push('/login/choose-tenant')">
						{{ $t('login.switch') }}
					</Button>
				</div>
				<Form v-slot="$form" class="flex flex-col gap-5" :initialValues="form" :resolver @submit="onFormSubmit">
					<div class="flex flex-col gap-1 relative">
						<label for="workEmail">{{ $t('email') }}</label>
						<InputText v-model="form.email" name="email" id="email"
							:placeholder="$t('your').toLowerCase() + '@email.com'" />
						<Message v-if="$form.email?.invalid" severity="error" size="small" variant="simple"
							class="absolute bottom-[-1.4rem]">
							{{ $t($form.email.error?.message) }}
						</Message>
					</div>
					<div class="flex flex-col gap-1 relative">
						<label for="password">{{ $t('password') }}</label>
						<Password v-model="form.password" class="w-full" placeholder="********" name="password"
							id="password" :toggleMask="true" :feedback="false"></Password>
						<Message v-if="$form.password?.invalid" severity="error" size="small" variant="simple"
							class="absolute bottom-[-1.4rem]">
							{{ $t($form.password.error?.message) }}
						</Message>
					</div>

					<Button class="mt-6" type="submit" :disabled="loading">
						<span v-if="!loading">{{ $t('login.title') }}</span>
						<IconLoader2 v-else class="animate-spin w-6 h-6" />
					</Button>
				</Form>

				<div class="text-center mt-5">
					{{ $t('dont_you_have_an_account') }}
					<RouterLink class="text-blue-500" :to="{ name: 'signup' }">
						{{ $t('sign_up') }}
					</RouterLink>
				</div>
			</div>
		</div>
	</div>
</template>
