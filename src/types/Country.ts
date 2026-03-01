import type { CountryCode } from 'libphonenumber-js/min'

export interface CountryCellphone {
  name: string
  code: CountryCode
  prefix: string
}
