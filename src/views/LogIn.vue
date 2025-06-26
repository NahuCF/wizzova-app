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
import type { Tenant } from '~/types/Tenant'
import type { User } from '~/types/User'

const sessionStore = useSessionStore()
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
    const response = await API.auth.login({
      email: form.value.email,
      password: form.value.password,
    })
    const data = response.data.data
    const meta = response.data.meta

    // if (data.verified_email === false) {
    //   router.push({ name: 'confirm-account' })
    // }

    const tenantData: Tenant = {
      id: data.id,
      email: data.email,
      verifiedEmail: data.verified_email,
      token: meta.token
    }

    const userData: User = {
      id: data.id,
      email: data.email,
      name: data.name
    }

    sessionStore.setTenant(tenantData)
    sessionStore.setUser(userData)

    router.replace({ name: 'conversations' })
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
        <Form
          v-slot="$form"
          class="flex flex-col gap-5"
          :initialValues="form"
          :resolver
          @submit="onFormSubmit"
        >
          <div class="flex flex-col gap-1 relative">
            <label for="workEmail">{{ $t('email') }}</label>
            <InputText
              v-model="form.email"
              name="email"
              id="email"
              :placeholder="$t('your').toLowerCase() + '@email.com'"
            />
            <Message
              v-if="$form.email?.invalid"
              severity="error"
              size="small"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
            >
              {{ $t($form.email.error?.message) }}
            </Message>
          </div>
          <div class="flex flex-col gap-1 relative">
            <label for="password">{{ $t('password') }}</label>
            <Password
              v-model="form.password"
              class="w-full"
              placeholder="********"
              name="password"
              id="password"
              :toggleMask="true"
              :feedback="false"
            ></Password>
            <Message
              v-if="$form.password?.invalid"
              severity="error"
              size="small"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
            >
              {{ $t($form.password.error?.message) }}
            </Message>
          </div>

          <Button class="mt-6" type="submit" :disabled="loading">
            <span v-if="!loading">{{ $t('login') }}</span>
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
