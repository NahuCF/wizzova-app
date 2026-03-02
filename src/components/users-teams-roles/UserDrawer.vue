<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconAsterisk, IconLoader2, IconInfoCircle, IconUpload } from '@tabler/icons-vue'
import type { Role, TeamItem, UserCreate, UserItem, WABAItem } from '~/types'
import { useRoleStore, useSessionStore, useTeamStore } from '~/stores'
import { storeToRefs } from 'pinia'
import { z } from 'zod'
import { useWabaStore } from '~/stores'

const props = defineProps<{
  title: string
  visible: boolean
  loading: boolean
  userEdited?: UserItem
}>()
const emit = defineEmits<{
  (e: 'onSave', payload: UserCreate, file?: File): void
  (e: 'update:visible', value: boolean): void
}>()

const roleStore = useRoleStore()
const teamStore = useTeamStore()
const wabaStore = useWabaStore()
const sessionStore = useSessionStore()
const { fetchRoles } = roleStore
const { fetchTeams } = teamStore
const { fetchWabas } = wabaStore
const { roles } = storeToRefs(roleStore)
const { teams } = storeToRefs(teamStore)
const { wabas } = storeToRefs(wabaStore)

const user = ref<{
  id: string
  name: string
  email: string
  role?: Role
  teams: TeamItem[]
  wabas: WABAItem[]
  defaultWaba?: WABAItem
}>({
  id: '',
  name: '',
  email: '',
  teams: [],
  wabas: [],
})
const emailError = ref<string | null>(null)
const emailSchema = z.string().email({ message: 'invalid_email' })

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const getRoles = computed(() => {
  return roles.value.map((role) => ({
    id: role.id,
    name: role.name,
    is_internal: role.is_internal,
  }))
})

const getTeams = computed(() => {
  return teams.value.map((team) => ({
    id: team.id,
    name: team.name,
  }))
})

const validateEmail = (email: string) => {
  const result = emailSchema.safeParse(email)
  emailError.value = result.success ? null : result.error.issues[0].message
  return result.success
}

const canSubmit = () => {
  return (
    user.value.name &&
    user.value.email &&
    validateEmail(user.value.email) &&
    user.value.role &&
    user.value.wabas.length > 0 &&
    (user.value.id || user.value.defaultWaba)
  )
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const onFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!validTypes.includes(file.type)) return
  if (file.size > 1 * 1024 * 1024) return

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  input.value = ''
}

const userInitial = computed(() => {
  return user.value.name?.charAt(0)?.toUpperCase() || '?'
})

const onConfirm = () => {
  emit(
    'onSave',
    {
      id: user.value.id,
      name: user.value.name,
      email: user.value.email,
      role: user.value.role?.name || '',
      team_ids: user.value.teams.map((t) => t.id),
      waba_ids: user.value.wabas.map((w) => w.id),
      default_waba_id: user.value.defaultWaba?.id,
    },
    selectedFile.value || undefined,
  )
}

watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      return
    }

    fetchRoles()
    fetchTeams()
    if (sessionStore.user?.business) {
      fetchWabas(sessionStore.user.business.id)
    }

    selectedFile.value = null

    if (props.userEdited) {
      user.value = {
        id: props.userEdited.id,
        name: props.userEdited.name,
        email: props.userEdited.email,
        role: props.userEdited.role,
        teams: props.userEdited.teams ? props.userEdited.teams : [],
        wabas: props.userEdited.wabas ? props.userEdited.wabas : [],
        defaultWaba: props.userEdited.default_waba,
      }
      previewUrl.value = props.userEdited.profile_img_path || null
    } else {
      user.value = {
        id: '',
        name: '',
        email: '',
        teams: [],
        wabas: [],
      }
      previewUrl.value = null
    }
  },
)

watch(
  () => user.value.email,
  (newEmail) => {
    if (!newEmail) {
      emailError.value = null
    } else {
      validateEmail(newEmail)
    }
  },
)
</script>

<template>
  <Drawer
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    class="w-[512px]!"
    :header="title"
    position="right"
  >
    <Divider class="mt-2!" />

    <div class="flex flex-col gap-6 pt-6">
      <div class="flex items-center gap-4">
        <Avatar
          v-if="previewUrl"
          :image="previewUrl"
          shape="circle"
          size="xlarge"
        />
        <Avatar
          v-else
          :label="userInitial"
          shape="circle"
          size="xlarge"
        />
        <div class="flex flex-col gap-1">
          <div class="flex gap-2">
            <Button
              size="small"
              severity="secondary"
              outlined
              @click="openFileDialog"
            >
              <IconUpload size="16" class="mr-1" />
              {{ $t('profile.upload_image') }}
            </Button>
          </div>
          <span class="text-xs text-gray-500">{{ $t('users.image_requirements') }}</span>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          class="hidden"
          @change="onFileSelect"
        />
      </div>

      <div class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-lg text-neutral-800! font-medium" for="name">{{
            $t('users.name.label')
          }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <InputText
          v-model="user.name"
          :placeholder="$t('users.name.placeholder')"
          fluid
          id="name"
          name="name"
        />
      </div>

      <div class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-lg text-neutral-800! font-medium" for="email">{{
            $t('users.email.label')
          }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <InputText
          v-model="user.email"
          :placeholder="$t('users.email.placeholder')"
          fluid
          id="email"
          name="email"
        />
        <Message v-if="emailError" severity="error" variant="simple">
          {{ $t(emailError) }}
        </Message>
      </div>

      <div class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-lg text-neutral-800! font-medium" for="roles">{{
            $t('users.role.label')
          }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <Select
          v-model="user.role"
          :options="getRoles"
          :placeholder="$t('users.role.placeholder')"
          optionLabel="name"
          class="w-full"
          id="roles"
          name="roles"
        />
      </div>

      <div class="flex flex-col gap-1 relative">
        <label class="text-lg text-neutral-800! font-medium" for="teams">{{
          $t('users.teams.label')
        }}</label>
        <MultiSelect
          v-model="user.teams"
          :options="getTeams"
          optionLabel="name"
          display="chip"
          :placeholder="$t('users.teams.placeholder')"
          class="w-full"
          id="teams"
          name="teams"
        />
      </div>

      <div class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-lg text-neutral-800! font-medium" for="wabas">{{
            $t('users.wabas.label')
          }}</label>
          <div
            class="flex items-center"
            v-tooltip.bottom="{
              value: $t('users.wabas.tooltip'),
              class: 'max-w-[300px]!',
            }"
          >
            <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="14" />
          </div>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <MultiSelect
          v-model="user.wabas"
          :options="wabas"
          optionLabel="name"
          display="chip"
          :placeholder="$t('users.wabas.placeholder')"
          class="w-full"
          id="wabas"
          name="wabas"
        />
      </div>

      <div v-if="!user.id" class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-lg text-neutral-800! font-medium" for="waba">{{
            $t('users.waba.label')
          }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <Select
          v-model="user.defaultWaba"
          :options="user.wabas"
          :disabled="user.wabas.length === 0"
          :placeholder="$t('users.waba.placeholder')"
          optionLabel="name"
          class="w-full"
          id="waba"
          name="waba"
        />
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
        <Button
          :disabled="loading || !canSubmit()"
          v-tooltip.top="
            !canSubmit() && {
              value: $t('users.create_user_tooltip'),
              class: 'text-base max-w-[300px]!',
            }
          "
          @click="onConfirm()"
        >
          <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
          <span v-else>{{ userEdited ? $t('submit') : $t('invite') }}</span>
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
