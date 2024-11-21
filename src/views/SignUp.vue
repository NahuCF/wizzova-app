<template>
  <div class="grid w-full h-screen grid-rows-[auto,1fr]">
    <div class="flex p-3">
      <LanguageSelector class="ml-auto" />
    </div>
    <div class="w-full flex items-center justify-center">
      <Form
        v-slot="$form"
        class="flex flex-col gap-3 border rounded-lg bg-white p-4 shadow-sm w-[30rem]"
        :initialValues="form"
        :resolver
        @submit="onFormSubmit"
      >
        <div class="flex flex-col gap-1">
          <label for="businessName">{{ $t('business_name') }}</label>
          <InputText
            v-model="form.businessName"
            name="businessName"
            id="businessName"
            :placeholder="$t('enter_your_business_ame')"
          />
          <Message
            v-if="$form.businessName?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $form.businessName.error?.message }}</Message
          >
        </div>
        <div class="flex flex-col gap-1">
          <label for="businessWebsite">{{ $t('business_website') }}</label>
          <InputText
            v-model="form.businessWebsite"
            name="businessWebsite"
            id="businessWebsite"
            :placeholder="$t('enter_your_business_website')"
          />
          <Message
            v-if="$form.businessWebsite?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $form.businessWebsite.error?.message }}</Message
          >
        </div>
        <div class="flex flex-col gap-1">
          <label for="your_name">{{ $t('your_name') }}</label>
          <InputText
            v-model="form.name"
            name="name"
            id="your_name"
            :placeholder="$t('enter_your_full_name')"
          />
          <Message v-if="$form.name?.invalid" severity="error" size="small" variant="simple">{{
            $form.name.error?.message
          }}</Message>
        </div>
        <div class="flex flex-col gap-1">
          <label for="your_cellphone">{{ $t('your_cellphone_number') }}</label>
          <div class="flex gap-2">
            <div
              @click="cellphonePopover.toggle($event)"
              class="flex items-center border border-slate-300 rounded-md p-2 hover:cursor-pointer"
            >
              <img
                src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
                :class="`flag flag-${selectedCountry.toLowerCase()} w-8`"
              />
            </div>
            <InputGroup>
              <InputGroupAddon
                :class="{
                  '!border-red-400': $form.cellphone?.invalid,
                }"
                >{{ getSelectedCountry.prefix }}</InputGroupAddon
              >
              <InputText v-model="form.cellphone" name="cellphone" class="grow" />
            </InputGroup>
          </div>
          <Message v-if="$form.cellphone?.invalid" severity="error" size="small" variant="simple">{{
            $form.cellphone.error?.message
          }}</Message>
        </div>
        <div class="flex flex-col gap-1">
          <label for="workEmail">{{ $t('work_email') }}</label>
          <InputText
            v-model="form.workEmail"
            name="workEmail"
            id="workEmail"
            :placeholder="$t('work_email_is_required')"
          />
          <Message v-if="$form.workEmail?.invalid" severity="error" size="small" variant="simple">{{
            $form.workEmail.error?.message
          }}</Message>
        </div>
        <Button class="mt-3" type="submit" :disabled="loading">
          <span v-if="!loading">{{ $t('sign_up') }}</span>
          <IconLoader2 v-else class="animate-spin w-6 h-6" />
        </Button>
      </Form>
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
            :class="`flag flag-${country.code.toLowerCase()} !w-6`"
          />
          <span>{{ country.name }}</span>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive } from 'vue'
import { Popover, InputText, Message, Button, InputGroup, InputGroupAddon } from 'primevue'
import { IconLoader2 } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import { z } from 'zod'
import { Form } from '@primevue/forms'
import { parsePhoneNumber } from 'libphonenumber-js/min'
import LanguageSelector from '~/components/LanguageSelector.vue'

const { t } = useI18n()
const cellphonePopover = ref()
const selectedCountry = ref('US')
const countries = ref([
  { name: 'Argentina', code: 'AR', prefix: '+54' },
  { name: 'Brazil', code: 'BR', prefix: '+55' },
  { name: 'Spain', code: 'ES', prefix: '+34' },
  { name: 'United States', code: 'US', prefix: '+1' },
])

const loading = ref(false)

const form = ref({
  businessName: '',
  businessWebsite: '',
  name: '',
  cellphone: '',
  workEmail: '',
})
const selectCountry = (country) => {
  selectedCountry.value = country.code
  cellphonePopover.value.hide()
}

const getSelectedCountry = computed(() => {
  return countries.value.find((country) => country.code === selectedCountry.value)
})

const resolver = zodResolver(
  z.object({
    businessName: z
      .string()
      .refine((value) => value.length > 0, {
        message: computed(() => t('business_name_is_required')),
      })
      .refine((value) => value.length >= 3, {
        message: computed(() => t('minimun_characters', { charactersCount: 3 })),
      }),
    businessWebsite: z
      .string()
      .refine((value) => value.length > 0, {
        message: computed(() => t('business_website_is_required')),
      })
      .refine((value) => z.string().url().safeParse(value).success, {
        message: computed(() => t('invalid_url')),
      })
      .refine((value) => /^https?:\/\//i.test(value), {
        message: computed(() => t('invalid_url')),
      }),
    name: z.string().refine((value) => value.length > 0, {
      message: computed(() => t('name_is_required')),
    }),
    cellphone: z.string().refine(
      (value) => {
        let phoneNumber = null
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
        message: computed(() => t('invalid_cellphone')),
      },
    ),
    workEmail: z
      .string()
      .refine((value) => value.length > 0, {
        message: computed(() => t('work_email_is_required')),
      })
      .refine((value) => z.string().email().safeParse(value).success, {
        message: computed(() => t('invalid_email')),
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
          message: computed(() => t('only_business_emails_allowed')),
        },
      ),
  }),
)

const onFormSubmit = ({ valid }) => {
  //loading.value = true
}
</script>

<style>
.p-popover-content {
  padding: 0 !important;
}
</style>
