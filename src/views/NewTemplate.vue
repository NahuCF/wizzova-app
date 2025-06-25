<script setup lang="ts">
import { API } from '~/services'
import { onMounted, ref, watch, computed } from 'vue'
import { useToast } from 'primevue'
import { IconAsterisk, IconInfoCircle, IconLoader2 } from '@tabler/icons-vue'
import { useTemplateStore } from '~/stores'
import { useI18n } from 'vue-i18n'
import type { TemplateCategory, Language, TemplateCreate } from '~/types'
import axios from 'axios'
import { useRouter } from 'vue-router'

const templateStore = useTemplateStore()
const { t } = useI18n()
const toast = useToast()
const router = useRouter()

const languages = ref<Language[]>([])
const templateCategories = ref<TemplateCategory[]>([])
const categoryChangeOptions = ref([
  { name: t('yes'), id: true },
  { name: t('no'), id: false },
])
const loading = ref(false)

const formatInputName = (event: Event) => {
  const target = event.target as HTMLInputElement | null

  if (target) {
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

  templateStore.template.category = categoryMarketing.name
}

const storeTemplate = async () => {
  const template = templateStore.template

  const payload: TemplateCreate = {
    name: template.name,
    language_id: template.languageId,
    category: template.category.toUpperCase(),
    components: {
      ...(template.header.type !== 'NONE' && { header: template.header }),
      body: template.body,
      ...(template.footer && { footer: template.footer }),
      buttons: templateStore.buttonsFilled,
    },
  }

  try {
    loading.value = true
    await API.template.store(payload)

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: t('new_template_created'),
      life: 3000,
    })

    templateStore.clearState()
    router.push({ name: 'templates' })
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

const canSubmit = computed(() => {
  return (
    templateStore.template.name &&
    templateStore.template.languageId &&
    templateStore.template.category &&
    templateStore.template.body.text &&
    !templateStore.variableKeys.find(
      (key) => templateStore.template.body.variables[key].trim() === '',
    )
  )
})

watch(
  () => templateStore.template.body.text,
  (newValue) => {
    templateStore.template.body.text = newValue.replace(/\n{2,}/g, '\n\n')
  },
)

onMounted(() => {
  fetchLanguages()
  fetchTemplateCategories()
})
</script>

<template>
  <div class="flex justify-center">
    <div class="w-[73rem] flex flex-col py-4 gap-4">
      <div class="flex justify-between items-center py-4 sticky top-0 z-2 bg-slate-100">
        <h1 class="font-semibold text-2xl">{{ t('new_template.title') }}</h1>
        <Button
          @click="storeTemplate"
          v-tooltip.bottom="{
            value: canSubmit ? '' : t('complete_mandatory_fields'),
            class: 'custom-tooltip',
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
              :placeholder="$t('template_name_placeholder')"
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
                  v-model="templateStore.template.category"
                  :options="templateCategories"
                  optionLabel="name"
                  optionValue="name"
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
              <TemplateHeader />

              <TemplateBody />

              <div>
                <div class="flex items-center gap-2 mb-2">
                  <h2 class="font-medium mb-1 text-lg">{{ $t('footer') }}</h2>
                  <IconInfoCircle
                    class="text-slate-700 hover:cursor-pointer"
                    size="16"
                    v-tooltip="t('footer_tooltip')"
                  />
                  <Badge severity="secondary">{{ $t('optional') }}</Badge>
                </div>
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
            <PreviewTemplate class="sticky top-22" />
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
