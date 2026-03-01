<script setup lang="ts">
import { API } from '~/services'
import { onMounted, ref, watch, computed } from 'vue'
import { IconAsterisk, IconInfoCircle, IconLoader2, IconArrowLeft } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type {
  TemplateCategory,
  Language,
  TemplateCreate,
  TemplateHeaderCode,
  TemplateCallBtn,
  TemplateUrlBtn,
  TemplateStatus,
} from '~/types'
import { useRoute, useRouter } from 'vue-router'
import { useCrudActions } from '~/composables/useCrudActions'
import { isCallButton, isUrlButton } from '~/types/guards'

const props = defineProps<{
  isEdit?: boolean
}>()

const { loading, createOrUpdate } = useCrudActions<TemplateCreate>({
  api: {
    create: API.template.create,
    update: API.template.update,
  },
  fetchData: () => {
    template.value = defaultValue
    returnToPage()
  },
  i18nKeys: {
    created: 'new_template_created',
    updated: 'edit_template.template_updated',
  },
})

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const defaultValue: TemplateCreate = {
  name: '',
  language: 'en',
  category: '',
  components: {
    header: {
      type: 'NONE',
      text: '',
    },
    body: {
      text: '',
      variables: [],
    },
    footer: '',
    buttons: [],
  },
}
const template = ref(defaultValue)
const languages = ref<Language[]>([])
const templateCategories = ref<TemplateCategory[]>([])
const status = ref<TemplateStatus>('PENDING')

const buttonsFilled = computed(() => {
  return template.value.components.buttons.filter((b) => {
    switch (b.type) {
      case 'STATIC_URL': {
        const urlBtn = b as TemplateUrlBtn
        return !!(urlBtn.text && urlBtn.url)
      }
      case 'DYNAMIC_URL': {
        const urlBtn = b as TemplateUrlBtn
        return !!(urlBtn.text && urlBtn.url && urlBtn.example)
      }
      case 'PHONE_NUMBER': {
        const phoneBtn = b as TemplateCallBtn
        return !!(phoneBtn.text && phoneBtn.phone_number && phoneBtn.phone_number_prefix)
      }
      case 'QUICK_REPLY': {
        return !!b.text
      }
      default:
        return false
    }
  })
})

const formatInputName = (event: Event) => {
  const target = event.target as HTMLInputElement | null

  if (target) {
    target.value = target.value.replace(/[^a-zA-Z0-9]/g, '_')
    template.value.name = target.value
  }
}

const fetchLanguages = async () => {
  const response = await API.templateLanguage.index()
  languages.value = response.data.data
}

const fetchTemplateCategories = async () => {
  const response = await API.templateCategory.index()
  templateCategories.value = response.data.data
  templateCategories.value = templateCategories.value.map((category) => ({
    id: category.name.toUpperCase(),
    name: category.name,
  }))

  const categoryMarketing = templateCategories.value.find((item) => item.name === 'Marketing')

  if (!categoryMarketing) return

  template.value.category = categoryMarketing.id
}

const fetchTemplate = async () => {
  if (props.isEdit && typeof route.params.id === 'string') {
    const { data: response } = await API.template.get(route.params.id)

    const emptyHeader = { type: 'NONE' as TemplateHeaderCode, text: '' }
    const templateEdit = response.data
    template.value = {
      ...templateEdit,
      components: {
        header: Array.isArray(templateEdit.components.header)
          ? emptyHeader
          : templateEdit.components.header,
        body: {
          text: templateEdit.components.body.content,
          variables: templateEdit.components.body.variables || [],
        },
        footer: templateEdit.components.footer,
        buttons: templateEdit.components.buttons.map((button) => ({
          ...button,
          category: isUrlButton(button) || isCallButton(button) ? 'cta' : 'custom_reply',
        })),
      },
    }
    status.value = templateEdit.status
  }
}

const returnToPage = () => {
  if (route.query.redirectTo && typeof route.query.redirectTo === 'string') {
    router.push({ name: route.query.redirectTo })
  } else {
    router.push({ name: 'templates' })
  }
}

const canSubmit = computed(() => {
  return (
    template.value.name &&
    template.value.language &&
    template.value.category &&
    template.value.components.body.text &&
    !template.value.components.body.variables.find((variable) => variable.value.trim() === '')
  )
})

const onSave = () => {
  const newTemplate: TemplateCreate = {
    ...template.value,
    category: template.value.category.toUpperCase(),
    components: {
      ...(template.value.components.header?.type !== 'NONE' && {
        header: template.value.components.header,
      }),
      body: template.value.components.body,
      ...(template.value.components.footer && { footer: template.value.components.footer }),
      buttons: buttonsFilled.value,
    },
  }

  createOrUpdate(newTemplate)
}

watch(
  () => template.value.components.body.text,
  (newValue) => {
    template.value.components.body.text = newValue.replace(/\n{2,}/g, '\n\n')
  },
)

onMounted(() => {
  fetchLanguages()
  fetchTemplateCategories()
  fetchTemplate()
})
</script>

<template>
  <div class="flex justify-center p-4">
    <div class="w-[1024px] flex flex-col gap-4">
      <div class="flex justify-between items-center py-4 sticky top-0 z-2 bg-slate-100">
        <div class="flex items-center gap-1">
          <Button variant="text" @click="returnToPage" class="p-1!" severity="secondary">
            <IconArrowLeft size="22" />
          </Button>
          <h1 class="font-semibold text-2xl">
            {{ isEdit ? t('edit_template.title') : t('new_template.title') }}
          </h1>
        </div>
        <Button
          @click="onSave"
          v-tooltip.bottom="{
            value: canSubmit ? '' : t('complete_mandatory_fields'),
            class: 'custom-tooltip text-sm',
          }"
          :disabled="!canSubmit || loading"
        >
          <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
          <span v-else>
            {{ $t('submit_for_review') }}
          </span>
        </Button>
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex flex-col gap-1 relative">
          <div class="flex gap-1">
            <label for="name" class="text-lg">{{ $t('template_name') }}</label>
            <IconAsterisk color="red" class="mt-1" size="8" />
          </div>
          <div
            class="relative"
            v-tooltip.bottom="
              status === 'APPROVED' && {
                value: $t('new_template.approved_field_tooltip'),
                class: 'text-base max-w-[300px]!',
              }
            "
          >
            <InputText
              v-model="template.name"
              class="!pr-[5.5rem]"
              name="name"
              id="name"
              fluid
              :maxlength="512"
              @input="formatInputName"
              :placeholder="$t('template_name_placeholder')"
              :disabled="status === 'APPROVED'"
            />
            <div class="absolute right-3 top-2 text-slate-400">
              {{ template.name.length }} / 512
            </div>
          </div>
        </div>

        <div class="flex gap-6">
          <div class="flex flex-col gap-6">
            <div class="gap-5 grid grid-cols-2">
              <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                  <label for="category" class="text-lg">{{ $t('category') }}</label>
                  <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <div
                  v-tooltip.bottom="
                    status === 'APPROVED' && {
                      value: $t('new_template.approved_field_tooltip'),
                      class: 'text-base max-w-[300px]!',
                    }
                  "
                >
                  <Select
                    v-model="template.category"
                    :options="templateCategories"
                    optionLabel="name"
                    optionValue="id"
                    name="category"
                    id="category"
                    :disabled="status === 'APPROVED'"
                    class="w-full"
                  />
                </div>
              </div>

              <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                  <label for="language" class="text-lg">{{ $t('language') }}</label>
                  <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <div
                  v-tooltip.bottom="
                    status === 'APPROVED' && {
                      value: $t('new_template.approved_field_tooltip'),
                      class: 'text-base max-w-[300px]!',
                    }
                  "
                >
                  <Select
                    v-model="template.language"
                    :options="languages"
                    optionLabel="name"
                    optionValue="code"
                    name="language"
                    id="language"
                    :disabled="status === 'APPROVED'"
                    class="w-full"
                  />
                </div>
              </div>
            </div>

            <div class="bg-white p-4 border rounded-md flex flex-col gap-7 border-slate-300">
              <TemplateHeader
                v-if="template.components.header"
                v-model:type="template.components.header.type"
                v-model:text="template.components.header.text"
              />

              <TemplateBody
                v-model:bodyText="template.components.body.text"
                v-model:variables="template.components.body.variables"
              />

              <div>
                <div class="flex items-center gap-2 mb-2">
                  <h2 class="font-medium mb-1 text-xl">{{ $t('footer') }}</h2>
                  <div
                    v-tooltip.bottom="{
                      value: t('footer_tooltip'),
                      class: 'text-sm max-w-[300px]!',
                    }"
                  >
                    <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="16" />
                  </div>
                  <Badge severity="secondary" class="text-base!">{{ $t('optional') }}</Badge>
                </div>
                <div class="relative">
                  <InputText
                    v-model="template.components.footer"
                    class="!pr-[5.5rem]"
                    name="name"
                    id="name"
                    fluid
                    :maxlength="60"
                    :placeholder="$t('example_footer_text')"
                  />
                  <div class="absolute right-3 top-2 text-slate-400">
                    {{ template.components.footer?.length }} / 60
                  </div>
                </div>
              </div>

              <AddButtons v-model:buttons="template.components.buttons" />
            </div>
          </div>

          <div>
            <PreviewTemplate :template="template" class="sticky top-22" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.custom-tooltip {
  max-width: none !important;
  padding: 8px 12px;
  white-space: normal !important;
  word-wrap: break-word !important;
}
</style>
