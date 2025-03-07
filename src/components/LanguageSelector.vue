<template>
  <Select
    v-model="selectedLanguage"
    :options="countries"
    optionLabel="name"
    placeholder="Select a Country"
    class="w-full md:w-56"
  >
    <template #value="slotProps">
      <div v-if="slotProps.value" class="flex items-center">
        <img
          :alt="`Country flag selected imagen ${slotProps.value.label}`"
          src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
          :class="`mr-2 flag flag-${slotProps.value.flag.toLowerCase()}`"
          style="width: 18px"
        />
        <div>{{ slotProps.value.name }}</div>
      </div>
      <span v-else>
        {{ slotProps.placeholder }}
      </span>
    </template>
    <template #option="slotProps">
      <div class="flex items-center">
        <img
          :alt="`Country flag selected imagen ${slotProps.option.label}`"
          src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
          :class="`mr-2 flag flag-${slotProps.option.flag.toLowerCase()}`"
          style="width: 18px"
        />
        <div>{{ slotProps.option.name }}</div>
      </div>
    </template>
  </Select>
</template>

<script lang="ts" setup>
import { Select } from 'primevue'
import { onMounted, ref, watch } from 'vue'
import i18n from '~/config/i18n'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const selectedLanguage = ref()
const countries = ref([])

watch(selectedLanguage, () => {
  i18n.global.locale = selectedLanguage.value.code
  localStorage.setItem('locale', selectedLanguage.value.code)
  populateCountries()
})

const getCountryFromCode = (code: string) => {
  return countries.value.find((country) => country.code === code)
}

const populateCountries = () => {
  countries.value = [
    { name: t('languages.english'), code: 'en', flag: 'us' },
    { name: t('languages.spanish'), code: 'es', flag: 'es' },
  ]
}

onMounted(() => {
  populateCountries()
  selectedLanguage.value = getCountryFromCode(i18n.global.locale)
})
</script>
