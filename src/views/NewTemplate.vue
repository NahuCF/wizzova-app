<script setup lang="ts">
import { API } from '~/services'
import { onMounted, ref, watch, computed } from 'vue'
import { useToast } from 'primevue'
import { IconAsterisk, IconInfoCircle, IconLoader2 } from '@tabler/icons-vue'
import { useTemplateStore } from '~/stores'
import { useI18n } from 'vue-i18n'
import PreviewTemplate from '~/components/templates/PreviewTemplate.vue'
import AddButtons from '~/components/new-template/AddButtons.vue'
import type { TemplateCategory, TemplateHeaderType, Language, TemplateCreate } from '~/types'
import axios from 'axios'

const templateStore = useTemplateStore()
const { t } = useI18n()
const toast = useToast()

const languages = ref<Language[]>([])
const templateCategories = ref<TemplateCategory[]>([])
const categoryChangeOptions = ref([
  { name: t('yes'), id: true },
  { name: t('no'), id: false },
])
const componentHeaderTypes = ref<TemplateHeaderType[]>([])
const loading = ref(false)

const formatInputName = (event: Event) => {
  const target = event.target as HTMLInputElement | null

  if(target) {
    target.value = target.value.replace(/[^a-zA-Z0-9]/g, '_')
    templateStore.template.name = target.value
  }
}

const fetchLanguages = async () => {
  const response = await API.templateLanguage.index()
  languages.value = response.data.data

  const englishLanguage = languages.value.find((item) => item.name === 'English')

  if (!englishLanguage) return

  templateStore.template.languageId = englishLanguage.id
}

const fetchTemplateCategories = async () => {
  const response = await API.templateCategory.index()
  templateCategories.value = response.data.data

  const categoryMarketing = templateCategories.value.find((item) => item.name === 'Marketing')

  if (!categoryMarketing) return

  templateStore.template.templateCategoryId = categoryMarketing.id
}

const storeTemplate = async () => {
  const template = templateStore.template

  const payload: TemplateCreate = {
    name: template.name,
    language_id: template.languageId,
    template_category_id: template.templateCategoryId,
    body: template.body,
  }

  const footerText = template.footer
  if (footerText) {
    payload.footer = footerText
  }

  try {
    loading.value = true
    await API.template.store(payload)
  } catch (error) {
    let errorMessage = t('an_error_occurred')

    if (axios.isAxiosError(error) && error.status === 422 && error.response) {
      errorMessage = t('validation_errors.' + error.response.data.message.replace('.', ''))
    }

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage,
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const fetchHeaderComponentTypes = async () => {
  const response = await API.templateHeader.headerTypes()
  componentHeaderTypes.value = response.data.data
}

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

const canSubmit = computed(() => {
  return (
    templateStore.template.name &&
    templateStore.template.languageId &&
    templateStore.template.templateCategoryId &&
    templateStore.template.body
  )
})

watch(
  () => templateStore.template.body,
  (newValue) => {
    templateStore.template.body = newValue.replace(/\n{2,}/g, '\n\n')
  },
)

onMounted(() => {
  fetchLanguages()
  fetchTemplateCategories()
  fetchHeaderComponentTypes()
})
</script>

<template>
  <div class="flex justify-center">
    <div class="w-[70rem] flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <h1 class="font-semibold text-2xl">{{ t('new_template.title') }}</h1>
        <Button
          @click="storeTemplate"
          v-tooltip.bottom="{
            value: canSubmit ? '' : t('complete_mandatory_fields'),
            class: 'custom-tooltip',
          }"
          :disabled="!canSubmit"
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
            <label for="name">{{ $t('template_name') }}</label>
            <IconAsterisk color="red" class="mt-1" size="8  " />
          </div>
          <div class="relative">
            <InputText
              v-model="templateStore.template.name"
              class="!pr-[5.5rem]"
              name="name"
              id="name"
              fluid
              :maxlength="512"
              @input="formatInputName"
              :placeholder="$t('welcome_template')"
            />
            <div class="absolute right-3 top-2 text-slate-400">
              {{ templateStore.template.name.length }} / 512
            </div>
          </div>
        </div>

        <div class="flex gap-6">
          <div class="flex flex-col gap-6">
            <div class="gap-5 grid grid-cols-3">
              <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                  <label for="category">{{ $t('category') }}</label>
                  <IconAsterisk color="red" class="mt-1" size="8  " />
                </div>
                <Select
                  v-model="templateStore.template.templateCategoryId"
                  :options="templateCategories"
                  optionLabel="name"
                  optionValue="id"
                  name="category"
                  id="category"
                />
              </div>

              <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                  <label for="language">{{ $t('language') }}</label>
                  <IconAsterisk color="red" class="mt-1" size="8  " />
                </div>
                <Select
                  v-model="templateStore.template.languageId"
                  :options="languages"
                  optionLabel="name"
                  optionValue="id"
                  name="language"
                  id="language"
                />
              </div>

              <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1 items-center">
                  <label for="allow_category_change">{{ $t('allow_category_change') }}</label>
                  <IconInfoCircle
                    class="text-slate-700 hover:cursor-pointer"
                    size="16"
                    v-tooltip="t('help_text_category_change')"
                  />
                </div>
                <Select
                  v-model="templateStore.template.allowCategoryChange"
                  :options="categoryChangeOptions"
                  optionLabel="name"
                  optionValue="id"
                  name="allow_category_change"
                  id="allow_category_change"
                />
              </div>
            </div>

            <div class="bg-white p-4 border rounded-md flex flex-col gap-7 border-slate-300">
              <div>
                <div class="flex gap-1">
                  <h2 class="font-medium mb-1 text-lg">{{ $t('body') }}</h2>
                  <IconAsterisk color="red" class="mt-1" size="8  " />
                </div>

                <div class="flex flex-col gap-1 relative">
                  <div class="relative">
                    <Textarea
                      v-model="templateStore.template.body"
                      rows="8"
                      cols="30"
                      fluid
                      class="min-h-[15rem]"
                      :maxlength="1024"
                      @keydown.enter="validateLineJump"
                      :placeholder="t('example_body_text_template')"
                    />
                    <div class="absolute right-3 bottom-2 text-slate-400">
                      {{ templateStore.template.body.length }} / 1024
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h2 class="font-medium mb-1 text-lg">{{ $t('footer') }}</h2>
                <div class="relative">
                  <InputText
                    v-model="templateStore.template.footer"
                    class="!pr-[5.5rem]"
                    name="name"
                    id="name"
                    fluid
                    :maxlength="60"
                    :placeholder="$t('example_footer_text')"
                  />
                  <div class="absolute right-3 top-2 text-slate-400">
                    {{ templateStore.template.footer.length }} / 60
                  </div>
                </div>
              </div>

              <AddButtons />
            </div>
          </div>

          <div>
            <PreviewTemplate />
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
  font-size: 14px;
}
</style>
