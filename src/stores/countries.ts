import { defineStore } from 'pinia'
import { onMounted, ref } from 'vue'
import type { CountryCellphone } from '~/types/Country'

export const useCountryStore = defineStore('country', () => {
  const countryPhones = ref<CountryCellphone[]>([
    { name: 'Argentina', code: 'AR', prefix: '+54' },
    { name: 'Brazil', code: 'BR', prefix: '+55' },
    { name: 'Spain', code: 'ES', prefix: '+34' },
    { name: 'United States', code: 'US', prefix: '+1' },
  ])

  const fetchCountryPhones = () => {
    countryPhones.value = [
      { name: 'Argentina', code: 'AR', prefix: '+54' },
      { name: 'Brazil', code: 'BR', prefix: '+55' },
      { name: 'Spain', code: 'ES', prefix: '+34' },
      { name: 'United States', code: 'US', prefix: '+1' },
    ]
  }

  const $reset = () => {
    countryPhones.value = []
  }

  onMounted(() => fetchCountryPhones())

  return {
    countryPhones,
    $reset,
  }
})
