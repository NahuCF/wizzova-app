<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import i18n from '~/config/i18n'
import { IconLoader2, IconCircleX, IconCircleCheck } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { parsePhoneNumber } from 'libphonenumber-js/min'
import { useRouter } from 'vue-router'
import { API } from '~/services/index'
import { useSessionStore } from '~/stores/session'
import { useToast } from 'primevue'
import axios from 'axios'
import type { FormSubmitEvent } from '@primevue/forms'
import type { CountryCellphone } from '~/types/Country'

const session = useSessionStore()

const router = useRouter()
const { t } = useI18n()
const toast = useToast()
const cellphonePopover = ref()
const selectedCountry = ref('US')
const passwordRules = ref([
  'password_min_length',
  'password_require_lowercase',
  'password_require_uppercase',
  'password_require_numeric',
])
const countries = ref<CountryCellphone[]>([
  { name: 'Argentina', code: 'AR', prefix: '+54' },
  { name: 'Brazil', code: 'BR', prefix: '+55' },
  { name: 'Spain', code: 'ES', prefix: '+34' },
  { name: 'United States', code: 'US', prefix: '+1' },
])

const loading = ref(false)

const form = ref({
  name: '',
  companyName: '',
  cellphone: '',
  workEmail: '',
  password: '',
})
const errors = ref({})

const selectCountry = (country: CountryCellphone) => {
  selectedCountry.value = country.code
  cellphonePopover.value.hide()
}

const getSelectedCountry = computed(() => {
  return countries.value.find((country) => country.code === selectedCountry.value)
})

const resolver = zodResolver(
  z.object({
    name: z.string().refine((value) => value.length > 0, {
      message: 'name_is_required',
    }),
    companyName: z.string().refine((value) => value.length > 0, {
      message: 'company_name_is_required',
    }),
    cellphone: z.string().refine(
      (value) => {
        let phoneNumber = null

        if (!getSelectedCountry.value) {
          return false
        }

        try {
          phoneNumber = parsePhoneNumber(
            getSelectedCountry.value.prefix + value,
            getSelectedCountry.value.code,
          )
        } catch (e) {
          return false
        }

        return phoneNumber.isValid()
      },
      {
        message: 'invalid_cellphone',
      },
    ),
    workEmail: z
      .string()
      .refine((value) => value.length > 0, {
        message: 'work_email_is_required',
      })
      .refine((value) => z.string().email().safeParse(value).success, {
        message: 'invalid_email',
      })
      .refine(
        (value) => {
          const personalDomains = [
            'gmail.com',
            'yahoo.com',
            'hotmail.com',
            'aol.com',
            'outlook.com',
          ]
          const splitstr = value.split('@').filter(Boolean)
          if (splitstr.length == 0 || splitstr[1] == undefined) {
            return
          }

          const domain = splitstr[1].toLowerCase()
          return !personalDomains.includes(domain)
        },
        {
          message: 'only_business_emails_allowed',
        },
      ),
    password: z
      .string()
      .refine((value) => value.length >= 8, {
        message: 'password_min_length',
      })
      .refine((value) => /[a-z]/.test(value), {
        message: 'password_require_lowercase',
      })
      .refine((value) => /[A-Z]/.test(value), {
        message: 'password_require_uppercase',
      })
      .refine((value) => /\d/.test(value), {
        message: 'password_require_numeric',
      }),
  }),
)

const onFormSubmit = async ({ valid }: FormSubmitEvent) => {
  if (!valid) return

  errors.value = {}

  try {
    loading.value = true
    const response = await API.auth.register({
      name: form.value.name,
      company_name: form.value.companyName,
      cellphone: form.value.cellphone,
      cellphone_prefix: getSelectedCountry.value?.prefix ?? '',
      work_email: form.value.workEmail,
      password: form.value.password,
      language: i18n.global.locale as string,
    })
    const { data: tenant } = response.data

    session.tenant = tenant

    router.push({
      name: 'confirm-account',
    })
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

onMounted(() => {
  session.$reset()
})
</script>

<template>
  <div class="flex flex-col w-full h-screen relative">
    <div class="flex absolute right-0 md:block p-3">
      <LanguageSelector class="ml-auto" />
    </div>
    <div class="w-full flex items-center justify-center flex-1">
      <div class="rounded-md bg-white p-16 shadow-md w-full md:w-[38rem] h-screen md:h-auto">
        <img src="/logo.svg" class="w-14 h-14 mx-auto mb-6" />
        <h1 class="text-4xl font-semibold text-center mb-8">
          {{ $t('grow_your_business_with') }}
          <span class="text-green-500">WhatsApp</span>
        </h1>
        <Form
          v-slot="$form"
          class="flex flex-col gap-5"
          :initialValues="form"
          :resolver
          @submit="onFormSubmit"
        >
          <div class="flex flex-col gap-1 relative">
            <label for="your_name">{{ $t('your_name') }}</label>
            <InputText
              v-model="form.name"
              name="name"
              id="your_name"
              :placeholder="$t('enter_your_full_name')"
            />
            <Message
              v-if="$form.name?.invalid"
              severity="error"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
              >{{ $t($form.name.error?.message) }}</Message
            >
          </div>

          <div class="flex flex-col gap-1 relative">
            <label for="company_name">{{ $t('signup.company_name.label') }}</label>
            <InputText
              v-model="form.companyName"
              name="companyName"
              id="companyName"
              :placeholder="$t('signup.company_name.placeholder')"
            />
            <Message
              v-if="$form.companyName?.invalid"
              severity="error"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
              >{{ $t($form.companyName.error?.message) }}</Message
            >
          </div>

          <div class="flex flex-col gap-1 relative">
            <label for="cellphone">{{ $t('your_cellphone_number') }}</label>
            <div class="flex gap-2">
              <div
                @click="cellphonePopover.toggle($event)"
                class="flex items-center border border-slate-300 rounded-md p-2 hover:cursor-pointer"
              >
                <img
                  :alt="`Country flag selected imagen ${selectedCountry}`"
                  src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
                  :class="`flag flag-${selectedCountry.toLowerCase()} w-8`"
                />
              </div>
              <InputGroup>
                <InputGroupAddon
                  :class="{
                    '!border-red-400': $form.cellphone?.invalid,
                  }"
                  >{{ getSelectedCountry?.prefix }}</InputGroupAddon
                >
                <InputText
                  v-model="form.cellphone"
                  name="cellphone"
                  id="cellphone"
                  class="grow"
                  :formControl="{ validateOnValueUpdate: false }"
                />
              </InputGroup>
            </div>
            <Message
              v-if="$form.cellphone?.invalid"
              severity="error"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
              >{{ $t($form.cellphone.error?.message) }}</Message
            >
          </div>
          <div class="flex flex-col gap-1 relative">
            <label for="workEmail">{{ $t('business_email') }}</label>
            <InputText
              v-model="form.workEmail"
              name="workEmail"
              id="workEmail"
              :placeholder="$t('business').toLowerCase() + '@email.com'"
            />
            <Message
              v-if="$form.workEmail?.invalid"
              severity="error"
              size="small"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
              >{{ $t($form.workEmail.error?.message) }}</Message
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
            >
              <template #content>
                <ul class="pl-2 ml-2 my-0 leading-normal">
                  <li
                    class="flex gap-1 items-center"
                    v-for="(rule, index) in passwordRules"
                    :key="index"
                  >
                    <IconCircleX
                      class="text-red-500"
                      size="22"
                      v-if="
                        $form.password?.errors?.some((error) => error.message === rule) ||
                        form.password == ''
                      "
                    />
                    <IconCircleCheck size="22" class="text-green-500" v-else />
                    {{ $t(`password_rules.${rule}`) }}
                  </li>
                </ul>
              </template>
            </Password>
            <Message
              v-if="$form.password?.invalid"
              severity="error"
              size="small"
              variant="simple"
              class="absolute bottom-[-1.4rem]"
              >{{ $t('invalid_password') }}</Message
            >
          </div>
          <Button class="mt-6" type="submit" :disabled="loading">
            <span v-if="!loading">{{ $t('sign_up') }}</span>
            <IconLoader2 v-else class="animate-spin w-6 h-6" />
          </Button>
        </Form>

        <div class="text-center mt-5">
          {{ $t('already_have_an_account') }}
          <RouterLink class="text-blue-500" :to="{ name: 'login' }">
            {{ $t('login.title') }}
          </RouterLink>
        </div>
      </div>
    </div>

    <Popover ref="cellphonePopover" class="!p-0">
      <div class="flex flex-col">
        <div
          v-for="country in countries"
          @click="selectCountry(country)"
          :key="country.code"
          class="flex gap-2 items-center hover:bg-slate-100 py-2 px-3 hover:cursor-pointer"
        >
          <img
            src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
            :alt="`Country flag imagen ${country.name}`"
            :class="`flag flag-${country.code.toLowerCase()} !w-6`"
          />
          <span>{{ country.name }}</span>
        </div>
      </div>
    </Popover>
  </div>
</template>

<style>
.p-popover-content {
  padding: 0 !important;
}

.p-password-input {
  width: 100% !important;
}
</style>
