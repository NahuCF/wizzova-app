<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { IconCopy, IconUpload, IconTrash, IconCheck } from '@tabler/icons-vue'
import { API } from '~/services'
import { useSessionStore } from '~/stores'
import type { UserItem } from '~/types'
import CellphoneInput from '~/components/CellphoneInput.vue'

const { t } = useI18n()
const toast = useToast()
const sessionStore = useSessionStore()

const loading = ref(false)
const uploadLoading = ref(false)
const deleteLoading = ref(false)
const saveLoading = ref(false)
const profileData = ref<UserItem | null>(null)
const copied = ref(false)
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const userId = computed(() => profileData.value?.id || '')
const profileImgUrl = computed(() => profileData.value?.profile_img_path || null)

const fullCellphone = computed({
  get: () => {
    if (!profileData.value?.cellphone_prefix || !profileData.value?.cellphone_number) {
      return ''
    }
    return profileData.value.cellphone_prefix + profileData.value.cellphone_number
  },
  set: (value: string) => {
    if (!profileData.value) return

    // Extract prefix and number from the full phone number
    // This is a simple implementation - the CellphoneInput component handles the logic
    const prefixMatch = value.match(/^(\+\d{1,4})(.*)$/)
    if (prefixMatch) {
      profileData.value.cellphone_prefix = prefixMatch[1]
      profileData.value.cellphone_number = prefixMatch[2]
    } else {
      profileData.value.cellphone_number = value
    }
  },
})

onMounted(async () => {
  await fetchProfile()
})

const fetchProfile = async () => {
  loading.value = true
  try {
    const { data } = await API.profile.get()
    profileData.value = data.data
    sessionStore.updateUser({
      ...sessionStore.user!,
      profile_img_path: data.data.profile_img_path,
    })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.error_loading'),
      life: 3000,
    })
  } finally {
    loading.value = false
  }
}

const copyUserId = async () => {
  if (!userId.value) return

  try {
    await navigator.clipboard.writeText(userId.value)
    copied.value = true
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('profile.id_copied'),
      life: 2000,
    })

    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.copy_failed'),
      life: 3000,
    })
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const onFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.file_too_large'),
      life: 3000,
    })
    return
  }

  // Validate file type
  if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.invalid_file_type'),
      life: 3000,
    })
    return
  }

  selectedFile.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // Auto upload
  uploadProfileImage()
}

const uploadProfileImage = async () => {
  if (!selectedFile.value) return

  uploadLoading.value = true
  try {
    const { data } = await API.profile.uploadProfileImage(selectedFile.value)
    profileData.value = data.data
    sessionStore.updateUser({
      ...sessionStore.user!,
      profile_img_path: data.data.profile_img_path,
    })
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('profile.image_uploaded'),
      life: 3000,
    })
    selectedFile.value = null
    previewUrl.value = null
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.upload_failed'),
      life: 3000,
    })
  } finally {
    uploadLoading.value = false
  }
}

const deleteProfileImage = async () => {
  deleteLoading.value = true
  try {
    const { data } = await API.profile.deleteProfileImage()
    profileData.value = data.data
    sessionStore.updateUser({
      ...sessionStore.user!,
      profile_img_path: null,
    })
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('profile.image_deleted'),
      life: 3000,
    })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.delete_failed'),
      life: 3000,
    })
  } finally {
    deleteLoading.value = false
  }
}

const updateProfile = async () => {
  saveLoading.value = true
  try {
    const { data } = await API.profile.update({
      name: profileData.value?.name,
      cellphone_prefix: profileData.value?.cellphone_prefix,
      cellphone_number: profileData.value?.cellphone_number,
    })
    profileData.value = data.data
    sessionStore.updateUser({
      ...sessionStore.user!,
      name: data.data.name,
    })
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('profile.updated'),
      life: 3000,
    })
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('profile.update_failed'),
      life: 3000,
    })
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-4xl">
    <Card>
      <template #header>
        <div class="flex items-center justify-between p-6">
          <h1 class="text-2xl font-semibold">{{ $t('profile.title') }}</h1>
        </div>
      </template>

      <template #content>
        <div v-if="loading" class="flex justify-center p-8">
          <ProgressSpinner />
        </div>
        <div v-else-if="profileData" class="space-y-6">
          <!-- User ID Section -->
          <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ $t('profile.user_id') }}
              </label>
              <div class="font-mono text-sm text-gray-600">
                {{ userId }}
              </div>
            </div>
            <Button
              :label="copied ? $t('copied') : $t('copy')"
              severity="secondary"
              size="small"
              @click="copyUserId"
              :disabled="!userId"
            >
              <template #icon>
                <component :is="copied ? IconCheck : IconCopy" class="w-4 h-4" />
              </template>
            </Button>
          </div>

          <!-- Profile Image Section -->
          <div class="space-y-4">
            <label class="block text-sm font-medium text-gray-700">
              {{ $t('profile.profile_image') }}
            </label>

            <div class="flex items-center gap-6">
              <!-- Current or Preview Image -->
              <div class="relative">
                <Avatar
                  v-if="previewUrl || profileImgUrl"
                  :image="previewUrl || profileImgUrl || undefined"
                  size="xlarge"
                  shape="circle"
                  class="w-24 h-24"
                />
                <Avatar
                  v-else
                  :label="profileData?.name?.charAt(0)?.toUpperCase()"
                  size="xlarge"
                  shape="circle"
                  class="w-24 h-24"
                />

                <!-- Upload overlay when loading -->
                <div
                  v-if="uploadLoading"
                  class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
                >
                  <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-col gap-2">
                <Button
                  :label="$t('profile.upload_image')"
                  severity="primary"
                  size="small"
                  @click="openFileDialog"
                  :loading="uploadLoading"
                >
                  <template #icon>
                    <IconUpload class="w-4 h-4" />
                  </template>
                </Button>

                <Button
                  v-if="profileImgUrl"
                  :label="$t('profile.remove_image')"
                  severity="danger"
                  size="small"
                  outlined
                  @click="deleteProfileImage"
                  :loading="deleteLoading"
                >
                  <template #icon>
                    <IconTrash class="w-4 h-4" />
                  </template>
                </Button>

                <span class="text-xs text-gray-500">
                  {{ $t('profile.image_requirements') }}
                </span>
              </div>
            </div>

            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              class="hidden"
              @change="onFileSelect"
            />
          </div>

          <!-- Profile Form -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ $t('profile.name') }}
              </label>
              <InputText v-model="profileData.name" class="w-full" :disabled="loading" />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ $t('profile.email') }}
              </label>
              <InputText :modelValue="profileData?.email" class="w-full" disabled />
            </div>

            <div class="space-y-2 md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ $t('profile.phone_number') }}
              </label>
              <CellphoneInput
                v-model="fullCellphone"
                :placeholder="$t('your_cellphone_number')"
                :disabled="loading"
              />
            </div>
          </div>
        </div>
        <div v-else class="flex justify-center p-8">
          <p>{{ $t('profile.error_loading') }}</p>
        </div>
      </template>

      <template #footer>
        <div v-if="profileData" class="flex justify-end p-6">
          <Button
            :label="$t('save')"
            severity="primary"
            @click="updateProfile"
            :loading="saveLoading"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
