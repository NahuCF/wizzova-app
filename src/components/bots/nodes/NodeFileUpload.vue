<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconFileText, IconTrash } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import type { FileUploadSelectEvent } from 'primevue'
import type { MediaNodeType } from '~/types'
import { defaultMBLimit, defaultSupportedFormats } from '~/composables/workflow/useFlowDragAndDrop'

const props = defineProps<{
  mediaType: MediaNodeType
  modelValue?: {
    data: File
    url: string
  } | null
  mediaUrl?: string
  supportedFormats?: Record<MediaNodeType, string[]>
  mediaMBLimit?: Record<MediaNodeType, number>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { data: File; url: string } | null): void
  (e: 'update:mediaUrl', value: string): void
}>()

const { t } = useI18n()
const fileUploadRef = ref()

const newFile = ref<{ data: File; url: string } | null>(props.modelValue || null)
const internalMediaUrl = ref(props.mediaUrl || '')
const showLink = ref(false)

const effectiveFormats = computed(() => props.supportedFormats || defaultSupportedFormats)
const effectiveLimit = computed(() => props.mediaMBLimit || defaultMBLimit)
const accept = computed(() => effectiveFormats.value[props.mediaType].join(','))
const maxFileSize = computed(() => effectiveLimit.value[props.mediaType] * 1000 * 1000)

const onFileSelect = (event: FileUploadSelectEvent) => {
  const file: File = event.files[0]
  newFile.value = {
    data: file,
    url: URL.createObjectURL(file),
  }
}

const removeFile = (removeCallback: (index: number) => void) => {
  removeCallback(0)
  newFile.value = null
  internalMediaUrl.value = ''
}

watch(newFile, (val) => emit('update:modelValue', val))
watch(internalMediaUrl, (val) => emit('update:mediaUrl', val))

watch(
  () => props.modelValue,
  (val) => {
    if (val !== newFile.value) newFile.value = val ?? null
  },
)
watch(
  () => props.mediaUrl,
  (val) => {
    if (val !== internalMediaUrl.value) internalMediaUrl.value = val || ''
  },
)
watch(showLink, () => {
  if (showLink.value) newFile.value = null
})
watch(
  () => props.mediaType,
  () => {
    newFile.value = null
    fileUploadRef.value?.clear()
  },
)
</script>

<template>
  <FileUpload
    ref="fileUploadRef"
    @select="onFileSelect"
    name="file"
    customUpload
    :showUploadButton="false"
    :showCancelButton="false"
    :accept="accept"
    :maxFileSize="maxFileSize"
    :pt="{
      root: { class: 'border-none!' },
      header: { class: 'p-0!' },
      content: { class: 'p-0!' },
    }"
  >
    <template #header="{ chooseCallback }">
      <div class="flex gap-3">
        <Button
          class="bg-white! border-slate-200! hover:bg-slate-100!"
          severity="secondary"
          @click="chooseCallback"
        >
          <span class="text-lg font-semibold">{{ t('upload') }}</span>
        </Button>

        <Button
          class="bg-white! border-slate-200! hover:bg-slate-100!"
          severity="secondary"
          @click="showLink = !showLink"
        >
          <span class="text-lg font-semibold">{{ t('link') }}</span>
        </Button>
      </div>
    </template>

    <template #content="{ removeFileCallback }">
      <div v-if="(internalMediaUrl || showLink) && !newFile" class="flex flex-col gap-1 mt-4">
        <label class="text-lg flex items-center gap-1">
          <span class="text-neutral-800">{{ t('bot_workflow.send_media.link') }}</span>
        </label>
        <InputText
          v-model="internalMediaUrl"
          class="w-full"
          :placeholder="t('bot_workflow.send_media.link_placeholder')"
        />
      </div>

      <div v-if="newFile || internalMediaUrl" class="relative flex bg-slate-100 rounded-md mt-4">
        <img
          v-if="mediaType === 'image'"
          class="min-w-[120px] h-[120px] object-contain bg-slate-200 rounded-l-md"
          :src="newFile?.url || internalMediaUrl"
        />
        <div
          v-else-if="mediaType === 'document'"
          class="flex justify-center items-center min-w-[120px] h-[120px] object-contain bg-slate-200 rounded-l-md"
        >
          <IconFileText class="text-emerald-500" size="50" />
        </div>

        <div class="flex flex-col justify-center gap-2 p-4 truncate">
          <div v-if="newFile?.data.name" class="text-xl font-medium text-slate-700 truncate">
            {{ newFile.data.name }}
          </div>
          <div class="text-lg text-sky-600 truncate">
            {{ (newFile?.url || internalMediaUrl).replace('blob:', '') }}
          </div>
        </div>

        <IconTrash
          class="absolute top-3 right-3 cursor-pointer"
          size="18"
          @click="removeFile(removeFileCallback)"
        />
      </div>
    </template>
  </FileUpload>
</template>
