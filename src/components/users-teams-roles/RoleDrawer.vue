<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconAsterisk, IconLoader2, IconInfoCircle } from '@tabler/icons-vue'
import type { Permission, RoleCreate, RoleItem } from '~/types'
import { useRoleStore } from '~/stores'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  title: string
  visible: boolean
  loading: boolean
  roleEdited?: RoleItem
}>()
const emit = defineEmits<{
  (e: 'onSave', payload: RoleCreate): void
  (e: 'update:visible', value: boolean): void
}>()

const roleStore = useRoleStore()
const { fetchPermissions } = roleStore
const { permissions } = storeToRefs(roleStore)

const role = ref<{
  id: number
  name: string
  permissions: Permission[]
}>({
  id: 0,
  name: '',
  permissions: [],
})

const hasAllPermissions = computed(() => {
  return role.value.permissions.length === permissions.value?.data.length
})

const canSubmit = () => {
  return role.value.name && role.value.permissions.length > 0
}

const onConfirm = () => {
  emit('onSave', {
    id: role.value.id,
    name: role.value.name,
    permissions: role.value.permissions.map((p) => p.name),
  })
}

const hasPermission = (name: string) => {
  return Boolean(role.value.permissions.find((p) => p.name === name))
}

const togglePermission = (permission: Permission) => {
  if (hasPermission(permission.name)) {
    role.value.permissions = role.value.permissions.filter((p) => p.name !== permission.name)
  } else {
    role.value.permissions = [...role.value.permissions, permission]
  }
}

const enableAllPermissions = () => {
  role.value.permissions = [...(permissions.value?.data || [])]
}

watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      return
    }

    fetchPermissions()

    if (props.roleEdited) {
      role.value = {
        id: props.roleEdited.id,
        name: props.roleEdited.name,
        permissions: props.roleEdited.permissions,
      }
    } else {
      role.value = {
        id: 0,
        name: '',
        permissions: [],
      }
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
      <div class="flex flex-col gap-1 relative">
        <div class="flex gap-1">
          <label class="text-neutral-800! font-medium text-lg" for="name">{{
            $t('roles.name.label')
          }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <InputText
          v-model="role.name"
          :placeholder="$t('roles.name.placeholder')"
          fluid
          id="name"
          name="name"
        />
      </div>
    </div>

    <div class="flex flex-col gap-6 pt-6">
      <div class="flex justify-between items-center pb-1">
        <div class="text-base text-neutral-800! font-medium">
          {{ $t('roles.role_permissions').toUpperCase() }}
        </div>

        <Button :modelValue="hasAllPermissions" @click="enableAllPermissions" variant="text">
          {{ $t('roles.enable_all') }}
        </Button>
      </div>

      <div
        v-for="[group, permissionList] in Object.entries(permissions?.meta.groups || {})"
        class="flex flex-col gap-1 relative"
      >
        <label class="text-base text-neutral-800! font-medium pb-3" for="name">{{
          group.toUpperCase()
        }}</label>
        <div
          class="flex justify-between items-center pb-1 text-base"
          v-for="permission in permissionList"
        >
          <div class="flex items-center gap-2">
            {{ permission.label }}
            <div
              v-tooltip.top="{
                value: permission.description,
                class: 'text-base max-w-[300px]!',
              }"
            >
              <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="16" />
            </div>
          </div>
          <ToggleSwitch
            :modelValue="hasPermission(permission.name)"
            @change="togglePermission(permission)"
          />
        </div>

        <Divider class="m-0!" />
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
              value: $t('roles.create_role_tooltip'),
              class: 'text-base max-w-[300px]!',
            }
          "
          @click="onConfirm()"
        >
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
