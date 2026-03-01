<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import {
  IconAsterisk,
  IconInfoCircle,
  IconStrikethrough,
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
} from '@tabler/icons-vue'
import { useContactFieldStore } from '~/stores'
import { useI18n } from 'vue-i18n'
import { useTextareaSelection } from '~/composables/useTextareaSelection'

const props = defineProps<{
  bodyText: string
  variables: { contact_field_id?: string; name: string; value: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:bodyText', value: string): void
  (e: 'update:variables', value: any[]): void
}>()

const contactFieldStore = useContactFieldStore()
const { t, te } = useI18n()

const bodyRef = ref()
const localBodyText = ref(props.bodyText)
const variablesPopover = ref()

const { wrapSelection } = useTextareaSelection(bodyRef, localBodyText)

const defaultVariables = computed(() => {
  return contactFieldStore.contactFields
})

const validateLineJump = (event: KeyboardEvent) => {
  const target = event.target as HTMLInputElement | null
  const text = target?.value ?? ''

  // Prevent more than 2 white spaces
  if (text.length > 0 && text.endsWith('\n\n')) {
    event.preventDefault()
  }

  // Prevent enter if there is nothing to show
  if (!/[^\n]/.test(text)) {
    event.preventDefault()
  }
}

const onBodyInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null

  if (target) {
    formatBody(target.value)
  }
}

const formatBody = (value: string) => {
  const variables: {
    contact_field_id?: string
    name: string
    value: string
  }[] = []

  // Replace variables blank or invalid spaces with underscore
  const formattedText = value.replace(/{{(.*?)}}/g, (_match, variableName) => {
    const name = variableName.replace(/[^a-zA-Z0-9]/g, '_')

    // Add variable if it doesnt exists
    const variableFound = props.variables.find((v) => v.name === name)
    const id = defaultVariables.value.find((df) => df.name === name)?.id
    const value = variableFound ? variableFound.value : ''

    variables.push({
      contact_field_id: id,
      name: name,
      value: value,
    })

    return `{{${name}}}`
  })

  emit('update:bodyText', formattedText)
  emit('update:variables', variables)
}

const getVariablePlaceholder = (variable: string) => {
  return te(`new_template.body.variable_placeholder.${variable}`)
    ? t(`new_template.body.variable_placeholder.${variable}`)
    : t(`new_template.body.variable_placeholder.default`)
}

const openVariablesPopover = (event: MouseEvent) => {
  variablesPopover.value.toggle(event)
}

const selectionFormatters = [
  {
    label: t('new_template.body.format.bold'),
    icon: IconBold,
    handler: () => wrapSelection('*', '*'),
  },
  {
    label: t('new_template.body.format.italic'),
    icon: IconItalic,
    handler: () => wrapSelection('_', '_'),
  },
  {
    label: t('new_template.body.format.strikethrough'),
    icon: IconStrikethrough,
    handler: () => wrapSelection('~', '~'),
  },
  {
    label: t('new_template.body.format.numbered_list'),
    icon: IconListNumbers,
    handler: () => wrapSelection('1. '),
  },
  {
    label: t('new_template.body.format.unordered_list'),
    icon: IconList,
    handler: () => wrapSelection('- '),
  },
]

const insertVariable = (variable: string) => {
  wrapSelection('{{' + variable + '}}')
  formatBody(localBodyText.value)

  variablesPopover.value?.hide()
}

const nextCustomVariable = () => {
  const matches = [...localBodyText.value.matchAll(/\{\{variable_(\d+)\}\}/g)]

  const maxNum = matches
    .map((match) => parseInt(match[1], 10))
    .reduce((max, num) => Math.max(max, num), 0)

  return `variable_${maxNum + 1}`
}

watch(
  () => props.bodyText,
  (val) => {
    localBodyText.value = val
  },
)

contactFieldStore.fetchContactFields()
</script>

<template>
  <div>
    <div class="flex gap-1">
      <h2 class="font-medium mb-1 text-xl">{{ $t('body') }}</h2>
      <IconAsterisk color="red" class="mt-1" size="8" />
    </div>

    <div class="flex flex-col gap-1 relative">
      <div class="relative">
        <Textarea
          ref="bodyRef"
          v-model="localBodyText"
          rows="8"
          cols="30"
          fluid
          class="text-xl! min-h-[16rem]"
          :maxlength="1024"
          @keydown.enter="validateLineJump"
          @input="onBodyInput"
          :placeholder="t('example_body_text_template')"
          size="large"
        />
        <div class="absolute right-3 bottom-2 text-slate-400">
          {{ localBodyText.length }} / 1024
        </div>
      </div>
    </div>

    <div class="mt-3">
      <div class="flex justify-between">
        <div class="flex items-center gap-2">
          <Button
            severity="info"
            variant="outlined"
            class="self-start !border !border-slate-300 font-bold text-base!"
            size="small"
            @click="openVariablesPopover"
          >
            {{ t('new_template.body.add_variable') }}
          </Button>
          <div
            v-tooltip.bottom="{
              value: t('new_template.body.variables_tooltip'),
              class: 'text-sm max-w-[300px]!',
            }"
          >
            <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="16" />
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div
            v-for="({ label, icon: Icon, handler }, idx) in selectionFormatters"
            :key="idx"
            class="p-1.5 cursor-pointer hover:bg-slate-100 rounded-full"
            :title="label"
            @click="handler"
          >
            <component :is="Icon" class="text-slate-700" size="13" />
          </div>
        </div>
      </div>

      <Popover ref="variablesPopover">
        <div class="pt-4 pb-2 min-w-[15rem]">
          <div class="font-semibold px-4 mb-2">{{ t('new_template.body.contact') }}</div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <li
              v-for="variable in defaultVariables"
              :key="`default_${variable}`"
              class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
              @click="insertVariable(variable.name)"
            >
              {{ variable.name }}
            </li>
            <li
              class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
              @click="insertVariable(nextCustomVariable())"
            >
              {{ $t('new_template.body.add_custom') }}
            </li>
          </ul>
        </div>
      </Popover>
    </div>

    <div
      v-if="props.variables.length > 0"
      class="flex flex-col gap-2 pt-8 pb-5 border-b-1 border-slate-200"
    >
      <div class="flex flex-col gap-2 w-[80%]">
        <div class="flex gap-16">
          <label class="w-full text-lg" for="language">{{
            $t('new_template.body.variable_name')
          }}</label>
          <label class="w-full text-lg" for="language">{{
            $t('new_template.body.sample_value')
          }}</label>
        </div>

        <div v-for="(variable, index) in props.variables" :key="variable.name" class="flex gap-16">
          <InputText :value="variable.name" :id="variable.name" :name="variable.name" fluid />
          <InputText
            :modelValue="variable.value"
            @update:modelValue="
              (val) => {
                const updated = [...props.variables]
                updated[index].value = val || ''
                emit('update:variables', updated)
              }
            "
            :placeholder="getVariablePlaceholder(variable.name)"
            fluid
          />
        </div>
      </div>

      <p class="text-slate-500 italic">
        {{ t('new_template.body.variables_info') }}
      </p>
    </div>
  </div>
</template>
