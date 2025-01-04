<template>
  <div>
    <Form
      v-slot="$form"
      class="flex flex-col gap-3 border rounded-lg bg-white p-8 shadow-sm w-[32rem]"
      :initialValues="form"
      :resolver
      @submit="onFormSubmit"
    >
      <h1 class="text-2xl font-semibold">Basic information</h1>
      <div class="flex gap-2">
        <div class="flex flex-col gap-1 basis-1/2 w-[40%]">
          <label for="country">{{ $t('country') }}</label>
          <Select
            v-model="form.countryId"
            :options="countries"
            optionValue="id"
            filter
            optionLabel="name"
            name="country"
            id="country"
            :placeholder="$t('select_dot')"
          />
          <Message v-if="$form.country?.invalid" severity="error" size="small" variant="simple">{{
            $form.country.error?.message
          }}</Message>
        </div>
        <div class="flex flex-col gap-1 basis-1/2 w-[40%]">
          <label for="currency">{{ $t('currency') }}</label>
          <Select
            v-model="form.currencyId"
            :options="currencies"
            optionValue="id"
            filter
            optionLabel="name"
            name="currency"
            id="currency"
            :placeholder="$t('select_dot')"
          />
          <Message v-if="$form.currency?.invalid" severity="error" size="small" variant="simple">{{
            $form.currency.error?.message
          }}</Message>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="timezone">{{ $t('timezone') }}</label>
        <Select
          v-model="form.timezoneId"
          :options="timezones"
          optionValue="id"
          filter
          optionLabel="name"
          name="timezone"
          id="timezone"
          :placeholder="$t('select_dot')"
        />
        <Message v-if="$form.timezone?.invalid" severity="error" size="small" variant="simple">{{
          $form.timezone.error?.message
        }}</Message>
      </div>

      <div class="flex gap-2">
        <div class="flex flex-col gap-1 basis-1/2">
          <label for="industry">{{ $t('industry') }}</label>
          <Select
            v-model="form.industryId"
            :options="industries"
            optionValue="id"
            filter
            optionLabel="name"
            name="industry"
            id="industry"
            :placeholder="$t('select_dot')"
          />
          <Message v-if="$form.industry?.invalid" severity="error" size="small" variant="simple">{{
            $form.industry.error?.message
          }}</Message>
        </div>
        <div class="flex flex-col gap-1 basis-1/2">
          <label for="employees">{{ $t('employees') }}</label>
          <Select
            v-model="form.employeesAmount"
            :options="employees"
            optionLabel="name"
            optionValue="value"
            name="employees"
            id="employees"
            :placeholder="$t('select_dot')"
          />
          <Message v-if="$form.employees?.invalid" severity="error" size="small" variant="simple">{{
            $form.employees.error?.message
          }}</Message>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="timezone">{{ $t('where_did_you_know_us') }}</label>
        <Select
          v-model="form.knowUs"
          :options="knownPlaces"
          optionValue="id"
          filter
          optionLabel="name"
          name="knowUs"
          id="kownUs"
          :placeholder="$t('select_dot')"
        />
        <Message v-if="$form.knowUs?.invalid" severity="error" size="small" variant="simple">{{
          $form.knowUs.error?.message
        }}</Message>
      </div>

      <Button class="mt-3" type="submit" :disabled="loading">
        <span v-if="!loading">{{ $t('complete') }}</span>
        <IconLoader2 v-else class="animate-spin w-6 h-6" />
      </Button>
      <div @click="setTenantUser">asdasd</div>
    </Form>
  </div>
</template>

<script lang="ts" setup>
import { useToast } from 'primevue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CountryService from '~/services/CountryService'
import CurrencyService from '~/services/CurrencyService'
import { Button, Select, Message } from 'primevue'
import { Form } from '@primevue/forms'
import { IconLoader2 } from '@tabler/icons-vue'
import TimezoneService from '~/services/TimezoneService'
import KnownPLaceService from '~/services/KnownPLaceService'
import IndustryService from '~/services/IndustryService'
import AuthService from '~/services/AuthService'
import { useSessionStore } from '~/stores/session'
import { useRouter } from 'vue-router'
import { useProfileCreationStore } from '~/stores/profileCreation'

const profileCreation = useProfileCreationStore()
const countries = ref([])
const currencies = ref([])
const timezones = ref([])
const knownPlaces = ref([])
const industries = ref([])
const employees = ref([
  { name: '1 - 10', value: 10 },
  { name: '50 - 100', value: 100 },
  { name: '100 - 200', value: 200 },
  { name: '200+', value: 999 },
])
const toast = useToast()
const { t } = useI18n()
const session = useSessionStore()
const router = useRouter()

const loading = ref(false)
const form = ref({
  countryId: '',
  currencyId: '',
  timezoneId: '',
  employeesAmount: 0,
  knowUs: '',
})

const resolver = ({ values }) => {
  const errors = {}

  if (!values.country) {
    errors.country = [{ message: t('required_field') }]
  }

  if (!values.currency) {
    errors.currency = [{ message: t('required_field') }]
  }

  if (!values.timezone) {
    errors.timezone = [{ message: t('required_field') }]
  }

  if (!values.industry) {
    errors.industry = [{ message: t('required_field') }]
  }

  if (!values.employees) {
    errors.employees = [{ message: t('required_field') }]
  }

  if (!values.knowUs) {
    errors.knowUs = [{ message: t('required_field') }]
  }

  return {
    errors,
  }
}

const fetchCountries = async () => {
  try {
    const response = await CountryService.index()
    countries.value = response.data.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const fetchCurrencies = async () => {
  try {
    const response = await CurrencyService.index()
    currencies.value = response.data.data.map((item) => {
      return {
        name: `${item.name} - ${item.code}`,
        id: item.id,
      }
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const fetchTimezones = async () => {
  try {
    const response = await TimezoneService.index()
    timezones.value = response.data.data.map((item) => {
      return {
        name: `${item.name} (${item.deviation})`,
        id: item.id,
      }
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const fetchKnownPLaces = async () => {
  try {
    const response = await KnownPLaceService.index()
    knownPlaces.value = response.data.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const fetchIndustry = async () => {
  try {
    const response = await IndustryService.index()
    industries.value = response.data.data
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const setTenantUser = async () => {
  try {
    session.tenant.filledBasicInformation = true
    const response = await AuthService.getTenantUser(session.tenant.id)
    session.setUser(response.data.data)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
}

const onFormSubmit = async ({ valid }) => {
  if (!valid) return

  loading.value = true
  try {
    await AuthService.storeBasicInformation(session.tenant.id, {
      country_id: form.value.countryId,
      currency_id: form.value.currencyId,
      timezone_id: form.value.timezoneId,
      employees_amount: form.value.employeesAmount,
      known_place_id: form.value.knowUs,
    })
    const subdomain = session.tenant.email.split('@')[1].split('.')[0]
    const companyDomain = import.meta.env.VITE_COMPANY_EMAIL_NAME

    session.tenant.filledBasicInformation = true

    await setTenantUser()

    if (subdomain == companyDomain) {
      router.replace({ name: 'chats' })
    } else {
      router.replace({ name: 'verify-whatsapp' })
    }
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (session.tenant.filledBasicInformation) {
    router.replace({ name: 'verify-whatsapp' })
    return
  }

  profileCreation.incrementProgress(2)

  fetchCountries()
  fetchCurrencies()
  fetchTimezones()
  fetchKnownPLaces()
  fetchIndustry()
})
</script>
