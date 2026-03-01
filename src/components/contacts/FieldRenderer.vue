<script setup lang="ts">
import { computed } from 'vue'
import { IconAsterisk, IconMail, IconPhone } from '@tabler/icons-vue'
import type { ContactFieldType } from '~/types'
import { useI18n } from 'vue-i18n'

type FieldValue = string | string[] | number | boolean | Date | null

const { t, te } = useI18n()

const props = defineProps<{
  field: {
    id: string
    name: string
    options?: string[]
  }
  type: ContactFieldType
  isMandatory: boolean
  userOptions?: { id: string; name: string }[]
  value: FieldValue
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'update:value', value: FieldValue): void
}>()

const innerValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val),
})

const textValue = computed({
  get: () => (typeof props.value === 'string' ? props.value : ''),
  set: (val: string) => {
    emit('update:value', val)
  },
})

const switchOptions = computed(() => {
  return [
    { label: t('yes'), value: true },
    { label: t('no'), value: false },
  ]
})

const switchValue = computed({
  get: () => (typeof props.value === 'boolean' ? props.value : null),
  set: (val: boolean | null) => {
    emit('update:value', val)
  },
})

const dateValue = computed({
  get: () => (props.value instanceof Date ? props.value : null),
  set: (val: Date | null) => {
    emit('update:value', val)
  },
})

const commonInputProps = computed(() => ({
  name: props.field.name,
  id: props.field.name,
  invalid: !!props.errorMessage,
  placeholder: te(`contacts.placeholder.${props.field.name}`)
    ? t(`contacts.placeholder.${props.field.name}`)
    : props.field.name,
}))

const multitextIcon = () => {
  switch (props.field.name) {
    case 'Email':
      return IconMail
    case 'Phone':
      return IconPhone
    default:
      return undefined
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-2 relative"
    :class="{
      'bg-slate-100': field.name === 'Marketing OptIn',
      'p-3': field.name === 'Marketing OptIn',
      'rounded-xl': field.name === 'Marketing OptIn',
    }"
  >
    <label class="text-lg flex items-center gap-1" :for="field.name">
      <span class="text-neutral-800">{{
        $te(`contacts.headers.${field.name}`) ? $t(`contacts.headers.${field.name}`) : field.name
      }}</span>
      <IconAsterisk v-if="isMandatory" color="red" size="8" />
    </label>

    <!-- TEXT -->
    <InputText
      v-if="type === 'TEXT'"
      v-model="textValue"
      fluid
      class="shadow-none!"
      v-bind="commonInputProps"
    />

    <!-- MULTI_TEXT -->
    <div v-else-if="type === 'MULTI_TEXT'">
      <TagInput v-if="field.name === 'Tags'" v-model="innerValue as string[]" />

      <MultiTextInput
        v-else-if="field.name === 'Phone'"
        v-model="innerValue as string[]"
        :fieldName="field.name"
        v-bind="commonInputProps"
      >
        <template #input="{ modelValue, update, invalid }">
          <CellphoneInput :modelValue="modelValue" :invalid="invalid" @update:modelValue="update" />
        </template>
      </MultiTextInput>

      <MultiTextInput
        v-else
        v-model="innerValue as string[]"
        :fieldName="field.name"
        :isGrouped="['Email'].includes(field.name)"
        :icon="multitextIcon()"
        v-bind="commonInputProps"
      />
    </div>

    <!-- NUMBER -->
    <InputText
      v-else-if="type === 'NUMBER'"
      v-model="textValue"
      class="shadow-none!"
      fluid
      v-keyfilter="/[0-9]/"
      v-bind="commonInputProps"
    />

    <!-- SELECT -->
    <Select
      v-else-if="type === 'SELECT'"
      v-model="innerValue"
      :options="field.options?.map((opt) => ({ label: opt, value: opt })) || []"
      optionLabel="label"
      optionValue="value"
      class="w-full"
      showClear
      v-bind="commonInputProps"
    />

    <!-- SWITCH -->
    <div v-if="type === 'SWITCH'" class="flex flex-col gap-2">
      <template v-if="field.name === 'Marketing OptIn'">
        <span class="text-sm text-slate-400 text-light">{{
          t('contacts.marketing_optin_help')
        }}</span>
      </template>
      <Select
        v-model="switchValue"
        :options="switchOptions"
        optionLabel="label"
        optionValue="value"
        showClear
        class="w-full"
        v-bind="commonInputProps"
      />
    </div>

    <!-- USER -->
    <Select
      v-else-if="type === 'USER'"
      v-model="innerValue"
      :options="userOptions || []"
      optionLabel="name"
      optionValue="id"
      class="w-full"
      showClear
      v-bind="commonInputProps"
    />

    <!-- DATE -->
    <DatePicker
      v-else-if="type === 'DATE'"
      v-model="dateValue"
      :showIcon="true"
      dateFormat="yy-mm-dd"
      mask="9999-99-99"
      placeholder="yyyy-mm-dd"
      :name="field.name"
      :id="field.name"
      class="w-full"
      :invalid="!!errorMessage"
    />

    <Message v-if="errorMessage" severity="error" variant="simple">
      {{
        $t(errorMessage, {
          field: $te(`contacts.headers.${field.name}`)
            ? $t(`contacts.headers.${field.name}`)
            : field.name,
        })
      }}
    </Message>
  </div>
</template>
