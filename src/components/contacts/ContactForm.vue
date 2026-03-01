<script setup lang="ts">
import parsePhoneNumberFromString from 'libphonenumber-js/min'
import moment from 'moment'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import { useUserStore } from '~/stores'
import type { ContactFieldItem, ContactFormValue, ContactItem } from '~/types'

const props = defineProps<{
  fields: ContactFieldItem[]
  contact?: ContactItem
}>()

const userStore = useUserStore()

const formValues = ref<Record<string, string | string[] | number | boolean | Date | null>>({})
const formErrors = ref<Record<string, string | null>>({})

const getBaseSchema = (field: ContactFieldItem) => {
  if (field.type === 'MULTI_TEXT' && field.internal_name?.toLowerCase() === 'phone') {
    return z.array(
      z.string().refine(
        (value) => {
          try {
            const phoneNumber = parsePhoneNumberFromString(value)
            return phoneNumber?.isValid() ?? false
          } catch {
            return false
          }
        },
        { message: 'invalid_cellphone' },
      ),
    )
  }

  const typeMap: Record<string, z.ZodTypeAny> = {
    TEXT: z.string().nullable(),
    MULTI_TEXT: z.array(z.string()),
    SELECT: z.string().nullable(),
    DATE: z.date().nullable(),
  }

  return typeMap[field.type] ?? z.any()
}

const dynamicSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {}

  props.fields.forEach((field) => {
    let base = getBaseSchema(field)

    if (field.is_mandatory) {
      base = base.refine(
        (val) => {
          if (val === null || val === undefined) return false
          if (Array.isArray(val)) return val.some((v) => v.trim?.())
          if (typeof val === 'string') return val.trim().length > 0
          return true
        },
        { message: 'required' },
      )
    } else {
      base = base.optional()
    }

    shape[field.name] = base
  })

  return z.object(shape)
})

const validateForm = () => {
  const result = dynamicSchema.value.safeParse(formValues.value)

  formErrors.value = {}
  if (!result.success) {
    for (const issue of result.error.issues) {
      formErrors.value[issue.path[0] as string] = issue.message
    }
    return null
  }
  return formatValues(formValues.value)
}

const formatValues = (values: Record<string, ContactFormValue>) => {
  return props.fields
    .map((f) => {
      let value = values[f.name]

      if (value instanceof Date) {
        value = moment(value).format('YYYY-MM-DD')
      } else if (Array.isArray(value)) {
        value = value.filter((v) => v.trim?.())
      }

      return {
        id: f.id,
        name: f.name,
        value,
      }
    })
    .filter((f) => {
      if (Array.isArray(f.value)) return f.value.length > 0

      return f.value !== null && f.value !== ''
    })
}

const fieldInit = (f: ContactFieldItem) => {
  const existing = props.contact?.fields.find((field) => field.name === f.name)
  if (existing) {
    if (f.type === 'DATE' && typeof existing.value === 'string') {
      const m = moment(existing.value, 'YYYY-MM-DD', true)
      return m.isValid() ? m.toDate() : null
    } else if (f.internal_name.toLowerCase() === 'phone' && typeof existing.value === 'string') {
      return existing.value.replace('+', '')
    }

    return existing.value
  }

  switch (f.type) {
    case 'TEXT':
      return ''
    case 'MULTI_TEXT':
      return f.name === 'Tags' ? [] : ['']
    case 'SELECT':
      return ''
    default:
      return null
  }
}

const initFields = () => {
  const values: Record<string, string | string[] | number | boolean | Date | null> = {}

  props.fields.forEach((f) => {
    values[f.name] = fieldInit(f)
  })

  formValues.value = values
  formErrors.value = {}
}

watch(
  () => props.fields,
  () => {
    initFields()
  },
  { immediate: true, deep: true },
)

watch(
  () => userStore.users.length,
  (len) => {
    if (len === 0) {
      userStore.fetchUsers()
    }
  },
  { immediate: true },
)

defineExpose({
  validate: validateForm,
  reset: initFields,
})
</script>

<template>
  <template v-for="field in fields.filter((f) => f.is_primary_field)" :key="field.id">
    <FieldRenderer
      :field="{ id: field.id, name: field.name, options: field.options }"
      :type="field.type"
      :is-mandatory="field.is_mandatory"
      :user-options="userStore.users"
      :error-message="formErrors[field.name] ?? undefined"
      v-model:value="formValues[field.name]"
    />
  </template>

  <div class="flex flex-col gap-2" v-if="fields.filter((f) => !f.is_primary_field).length > 0">
    <label class="text-lg text-neutral-800! font-medium">
      {{ $t('contacts.additional_details') }}
    </label>
    <div class="flex flex-col gap-6">
      <template v-for="field in fields.filter((f) => !f.is_primary_field)" :key="field.id">
        <FieldRenderer
          :field="{ id: field.id, name: field.name, options: field.options }"
          :type="field.type"
          :is-mandatory="field.is_mandatory"
          :user-options="userStore.users"
          :error-message="formErrors[field.name] ?? undefined"
          v-model:value="formValues[field.name]"
        />
      </template>
    </div>
  </div>
</template>
