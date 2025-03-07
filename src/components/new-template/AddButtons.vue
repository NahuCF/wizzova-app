<template>
  <div>
    <div class="flex flex-col gap-1">
      <h2 class="font-medium text-lg">{{ $t('Buttons') }}</h2>

      <p class="text-slate-500 text-sm">{{ t('help_text_buttons') }}</p>

      <Button
        severity="secondary"
        @click="openPopoverButton"
        class="self-start !border !border-slate-300 mt-2"
        :disabled="newTemplateStore.template.buttons.length >= 10"
        v-tooltip:bottom="{
          value: canAddMoreButtons ? '' : tooltipContent,
          escape: false,
          class: 'custom-tooltip',
        }"
      >
        <IconPlus size="16" class="mr-2" />
        {{ t('add_button') }}
      </Button>

      <div v-for="btn in newTemplateStore.template.buttons">
        {{ btn }}
      </div>

      <Popover ref="popoverButton">
        <div class="p-3 min-w-[15rem]">
          <div class="font-semibold mb-2">{{ t('quick_answer_buttons') }}</div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <li
              :class="[
                'flex items-center gap-2 px-2 py-3 hover:bg-slate-100 cursor-pointer rounded-border',
                {
                  'opacity-50 cursor-not-allowed ': !canAddMoreButtons,
                },
              ]"
              @click="addButton({ type: 'custom_reply' })"
            >
              <div class="flex gap-1">
                <IconArrowBackUp size="18" />
                <span>
                  {{ t('custom_reply') }}
                </span>
              </div>
            </li>
          </ul>
          <Divider />
          <div class="font-semibold mb-2">{{ t('cto_button') }}</div>
          <ul class="list-none p-0 m-0 flex flex-col">
            <li
              v-for="option in ctoButtonOptions"
              :class="[
                'flex items-center gap-2 px-2 py-3 hover:bg-slate-100 cursor-pointer rounded-border',
                {
                  'opacity-50 cursor-not-allowed ': !canAddButton(option.type, option.maximun),
                },
              ]"
              @click="addButton(option)"
            >
              <div class="flex gap-1">
                <component :is="iconComponents[option.icon]" size="18" />
                <div>
                  <p>
                    {{ t(option.name) }}
                  </p>
                  <p class="text-slate-400 text-sm">{{ t(option.description) }}</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </Popover>
    </div>
  </div>
</template>

<script setup>
import { LanguageService, TemplateCategoryService, ComponentTypeService } from '~/services'
import { onMounted, ref, watch, computed } from 'vue'
import { Button, InputText, Select, Textarea, useToast, Popover, Divider } from 'primevue'
import {
  IconPhone,
  IconAsterisk,
  IconInfoCircle,
  IconLoader2,
  IconPlus,
  IconArrowBackUp,
  IconExternalLink,
} from '@tabler/icons-vue'
import { useNewTemplateStore } from '~/stores'
import { useI18n } from 'vue-i18n'
import PreviewTemplate from '~/components/templates/PreviewTemplate.vue'
import TemplateService from '~/services/TemplateService'

const newTemplateStore = useNewTemplateStore()
const { t } = useI18n()

const popoverButton = ref(null)
const ctoButtonOptions = ref([
  {
    id: 'url',
    type: 'url',
    name: 'URL',
    icon: 'IconExternalLink',
    description: 'max_2_buttons',
    maximun: 2,
  },
  {
    id: 'ctn',
    type: 'phone_number',
    name: 'call_to_number',
    icon: 'IconPhone',
    description: 'max_1_buttons',
    maximun: 1,
  },
])
const iconComponents = { IconExternalLink, IconPhone }
const tooltipContent = ref(
  `<strong class="font-semibold break-keep whitespace-nowrap">${t('button_limit_reached')}</strong>
    <span class="text-slate-200">${t('first_delete_a_button')}</span>`,
)

const canAddMoreButtons = computed(() => {
  return newTemplateStore.template.buttons.length < 10
})

const addButton = (option) => {
  newTemplateStore.template.buttons.push({
    type: option.type,
  })

  popoverButton.value.hide()
}

const openPopoverButton = (event) => {
  popoverButton.value.toggle(event)
}
const canAddButton = (btnType, max) => {
  let buttonsOfType = newTemplateStore.template.buttons.filter((btn) => btn.type === btnType)
  console.log(buttonsOfType, btnType)
  return buttonsOfType.length < max
}
</script>
