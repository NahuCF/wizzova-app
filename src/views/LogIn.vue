<template>
  <div class="flex flex-col w-full h-screen relative">
    <div class="flex absolute right-0 hidden md:block p-3">
      <LanguageSelector class="ml-auto" />
    </div>
    <div class="w-full flex items-center justify-center flex-1">
      <div class="rounded-md bg-white p-16 shadow-md w-full md:w-[38rem] h-screen md:h-auto">
        <h1 class="text-4xl text-center mb-8 font-bold mb-18 text-neutral-800">
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
              >{{ $form.email.error?.message }}</Message
            >
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
              >{{ $form.password.error?.message }}</Message
            >
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

<script lang="ts" setup>
import { computed, ref, onMounted, watch } from 'vue'
import {
  Popover,
  InputText,
  Password,
  Message,
  Button,
  InputGroup,
  Checkbox,
  InputGroupAddon,
} from 'primevue'
import { IconLoader2, IconCircleX, IconCircleCheck } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { Form } from '@primevue/forms'
import { parsePhoneNumber } from 'libphonenumber-js/min'
import LanguageSelector from '~/components/LanguageSelector.vue'
import { useRouter } from 'vue-router'
import AuthService from '~/services/AuthService'
import { useSessionStore } from '~/stores/session'
import type { Tenant } from '~/types/Tenant'
import type { User } from '~/types/User'
import { useProfileCreationStore } from '~/stores/profileCreation'
import { useToast } from 'primevue'

const sessionStore = useSessionStore()

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const loading = ref(false)

const form = ref({
  email: '',
  password: '',
})

const errors = ref({})

const resolver = zodResolver(
  z.object({
    email: z.string().refine((value) => value.length > 0, {
      message: computed(() => t('the_email_is_required')),
    }),
    password: z.string().refine((value) => value.length > 0, {
      message: computed(() => t('password_is_required')),
    }),
  }),
)

const onFormSubmit = async ({ valid }) => {
  if (!valid) return

  errors.value = {}

  try {
    loading.value = true
    let response = await AuthService.login({
      email: form.value.email,
      password: form.value.password,
    })
    let tenant = response.data.data
    let user = response.data.meta.user

    if (tenant.verified_email === false) {
      router.push({ name: 'confirm-account' })
    }

    let tenantData = {
      id: tenant.id,
      email: tenant.email,
      verifiedEmail: tenant.verified_email,
    } as Tenant

    let userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      cellphonePrefix: user.cellphone_prefix,
      cellphoneNumber: user.cellphone_number,
    } as User

    sessionStore.setTenant(tenantData)
    sessionStore.setUser(userData)

    router.replace({ name: 'conversations' })
  } catch (error) {
    let errorMessage = t('an_error_occurred')
    if (error.status == 422) {
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
