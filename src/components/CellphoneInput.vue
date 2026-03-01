<script setup lang="ts">
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min'
import { computed, onMounted, ref } from 'vue'
import { useCountryStore } from '~/stores'
import type { CountryCellphone } from '~/types/Country'

const props = defineProps<{
  modelValue: string
  countryCode?: CountryCode
  placeholder?: string
  invalid?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:countryCode', value: CountryCode): void
}>()

const countryStore = useCountryStore()

const selectedCountry = ref<CountryCode>(props.countryCode || 'US')
const cellphonePopover = ref()

const country = computed(() => {
  return countryStore.countryPhones.find((country) => country.code === selectedCountry.value)
})

const localNumber = computed(() => {
  const currentPrefix = country.value?.prefix || ''
  return props.modelValue.replace(currentPrefix, '')
})

const selectCountry = (newCountry: CountryCellphone) => {
  const input = props.modelValue || ''

  const matched = countryStore.countryPhones.find((c) => input.startsWith(c.prefix))
  const currentPrefix = matched?.prefix || ''

  const nationalNumber = input.slice(currentPrefix.length)

  if (props.countryCode) {
    emit('update:countryCode', newCountry.code)
  }
  selectedCountry.value = newCountry.code
  cellphonePopover.value.hide()

  props.countryCode
    ? emit('update:modelValue', nationalNumber)
    : emit('update:modelValue', newCountry.prefix + nationalNumber)
}

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null
  if (!target) return

  props.countryCode
    ? emit('update:modelValue', target.value)
    : emit('update:modelValue', country.value?.prefix + target.value)
}

onMounted(() => {
  const phoneNumber = parsePhoneNumberFromString(props.modelValue || '')
  const initCountry = countryStore.countryPhones.find((c) => c.code === phoneNumber?.country)

  if (initCountry) {
    selectCountry(initCountry)
  }
})
</script>

<template>
  <div class="flex w-full">
    <div class="flex gap-2 w-full">
      <div
        @click="cellphonePopover.toggle($event)"
        class="flex items-center border border-slate-300 rounded-md p-2 hover:cursor-pointer"
      >
        <img
          :alt="`Country flag selected imagen ${selectedCountry}`"
          src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
          :class="`flag flag-${selectedCountry.toLowerCase()} w-7!`"
        />
      </div>
      <InputGroup>
        <InputGroupAddon
          class="flex justify-center items-center"
          :class="{
            '!border-red-400': invalid,
          }"
        >
          <span class="text-sm h-[14px] leading-4">{{ country?.prefix }}</span>
        </InputGroupAddon>
        <InputText
          name="cellphone"
          id="cellphone"
          class="shadow-none!"
          :formControl="{ validateOnValueUpdate: false }"
          :placeholder="placeholder"
          :invalid="invalid"
          v-keyfilter="/[0-9]/"
          :value="localNumber"
          @input="onInput"
        />
      </InputGroup>
    </div>
    <Popover ref="cellphonePopover" class="!p-0">
      <div class="flex flex-col">
        <div
          v-for="country in countryStore.countryPhones"
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
