<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue'
import { IconLoader2, IconPlus, IconTrash, IconUpload } from '@tabler/icons-vue'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import type { WABANumber } from '~/types'

const props = defineProps<{
  visible: boolean
  phoneNumber: WABANumber | null
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()
const toast = useToast()
const handleError = useErrorHandler()

const loading = ref(false)
const loadingProfile = ref(false)
const verticals = ref<string[]>([])
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(null)

const formData = ref({
  about: '',
  address: '',
  description: '',
  email: '',
  vertical: '',
  websites: [] as string[],
})

const allowedImageTypes = ['image/jpeg', 'image/png']

const verticalOptions = (items: string[]) => {
  return items.map((v) => ({
    label: t(`whatsapp_settings.verticals.${v}`),
    value: v,
  }))
}

const fetchVerticals = async () => {
  if (verticals.value.length > 0) return
  try {
    const response = await API.phoneNumber.verticals()
    verticals.value = response.data.data
  } catch (error) {
    handleError(error)
  }
}

const fetchProfile = async () => {
  if (!props.phoneNumber) return
  loadingProfile.value = true
  try {
    const response = await API.phoneNumber.showProfile(props.phoneNumber.id)
    const data = response.data.data
    formData.value = {
      about: data.about || '',
      address: data.address || '',
      description: data.description || '',
      email: data.email || '',
      vertical: data.vertical || '',
      websites: data.websites || [],
    }
    imagePreview.value = data.picture_url || null
  } catch (error) {
    handleError(error)
  } finally {
    loadingProfile.value = false
  }
}

const onImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!allowedImageTypes.includes(file.type)) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('whatsapp_settings.profile.image_invalid_format'),
      life: 3000,
    })
    target.value = ''
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('whatsapp_settings.profile.image_too_large'),
      life: 3000,
    })
    target.value = ''
    return
  }

  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const addWebsite = () => {
  if (formData.value.websites.length < 2) {
    formData.value.websites.push('')
  }
}

const removeWebsite = (index: number) => {
  formData.value.websites.splice(index, 1)
}

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const save = async () => {
  if (!props.phoneNumber) return

  const filledWebsites = formData.value.websites.filter((w) => w.trim() !== '')
  for (const url of filledWebsites) {
    if (!isValidUrl(url)) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('whatsapp_settings.profile.invalid_website'),
        life: 3000,
      })
      return
    }
  }

  loading.value = true
  try {
    const payload: Record<string, unknown> = {
      about: formData.value.about || null,
      address: formData.value.address || null,
      description: formData.value.description || null,
      email: formData.value.email || null,
      vertical: formData.value.vertical || null,
      websites: filledWebsites.length > 0 ? filledWebsites : null,
    }

    await API.phoneNumber.updateProfile(props.phoneNumber.id, payload as Partial<WABANumber>)

    if (imageFile.value) {
      await API.phoneNumber.uploadProfilePicture(props.phoneNumber.id, imageFile.value)
    }

    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('whatsapp_settings.profile.saved'),
      life: 3000,
    })

    imageFile.value = null
    emit('saved')
    emit('update:visible', false)
  } catch (error) {
    handleError(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      fetchVerticals()
      fetchProfile()
      imageFile.value = null
    }
  },
)
</script>

<template>
  <Drawer
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    class="w-[560px]!"
    :header="$t('whatsapp_settings.profile.title')"
    position="right"
  >
    <Divider class="mt-2!" />

    <ProgressSpinner v-if="loadingProfile" class="mx-auto mt-8" />

    <div v-else class="flex flex-col gap-6 pt-6">
      <div class="flex flex-col items-center gap-2">
        <Avatar
          v-if="imagePreview"
          :image="imagePreview"
          size="xlarge"
          shape="circle"
          class="w-20 h-20"
        />
        <Avatar v-else size="xlarge" shape="circle" class="w-20 h-20" icon="pi pi-user" />

        <label
          class="flex items-center gap-1 text-sm text-primary-600 cursor-pointer hover:underline"
        >
          <IconUpload size="14" />
          {{ $t('whatsapp_settings.profile.upload_picture') }}
          <input type="file" accept="image/jpeg,image/png" class="hidden" @change="onImageSelect" />
        </label>
        <span class="text-xs text-slate-400 text-center">
          {{ $t('whatsapp_settings.profile.picture_requirements') }}
        </span>
      </div>

      <div class="flex flex-col gap-1">
        <label for="about">{{ $t('whatsapp_settings.profile.about') }}</label>
        <Textarea
          v-model="formData.about"
          id="about"
          :placeholder="$t('whatsapp_settings.profile.about_placeholder')"
          :maxlength="139"
          rows="2"
          fluid
        />
        <span class="text-xs text-slate-400 text-right">{{ formData.about.length }}/139</span>
      </div>

      <div class="flex flex-col gap-1">
        <label for="address">{{ $t('whatsapp_settings.profile.address') }}</label>
        <InputText
          v-model="formData.address"
          id="address"
          :placeholder="$t('whatsapp_settings.profile.address_placeholder')"
          :maxlength="256"
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="description">{{ $t('whatsapp_settings.profile.description') }}</label>
        <Textarea
          v-model="formData.description"
          id="description"
          :placeholder="$t('whatsapp_settings.profile.description_placeholder')"
          :maxlength="512"
          rows="3"
          fluid
        />
        <span class="text-xs text-slate-400 text-right"
          >{{ formData.description.length }}/512</span
        >
      </div>

      <div class="flex flex-col gap-1">
        <label for="email">{{ $t('whatsapp_settings.profile.email') }}</label>
        <InputText
          v-model="formData.email"
          id="email"
          type="email"
          :placeholder="$t('whatsapp_settings.profile.email_placeholder')"
          :maxlength="128"
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="vertical">{{ $t('whatsapp_settings.profile.vertical') }}</label>
        <Select
          v-model="formData.vertical"
          :options="verticalOptions(verticals)"
          optionLabel="label"
          optionValue="value"
          :placeholder="$t('whatsapp_settings.profile.vertical_placeholder')"
          fluid
        />
      </div>

      <div class="flex flex-col gap-1">
        <label>{{ $t('whatsapp_settings.profile.websites') }}</label>
        <div
          v-for="(_, index) in formData.websites"
          :key="index"
          class="flex items-center gap-2 mb-2"
        >
          <InputText
            v-model="formData.websites[index]"
            placeholder="https://example.com"
            fluid
          />
          <Button
            variant="text"
            severity="danger"
            size="small"
            rounded
            @click="removeWebsite(index)"
          >
            <IconTrash size="16" />
          </Button>
        </div>
        <Button
          v-if="formData.websites.length < 2"
          variant="text"
          size="small"
          class="self-start"
          @click="addWebsite"
        >
          <IconPlus size="14" class="mr-1" />
          {{ $t('whatsapp_settings.profile.add_website') }}
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button
          class="bg-white! border-slate-200! hover:bg-slate-100!"
          severity="secondary"
          @click="emit('update:visible', false)"
        >
          {{ $t('cancel') }}
        </Button>
        <Button @click="save" :disabled="loading">
          <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
          <span v-else>{{ $t('submit') }}</span>
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style lang="css" scoped>
:deep(.p-drawer-content) {
  padding-bottom: 0 !important;
}
</style>
