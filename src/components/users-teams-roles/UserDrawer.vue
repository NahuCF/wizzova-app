<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconAsterisk, IconLoader2 } from '@tabler/icons-vue'
import type { Role, TeamItem, UserCreate, UserItem } from '~/types'
import { useRoleStore, useTeamStore } from '~/stores'
import { storeToRefs } from 'pinia'

const props = defineProps<{
	title: string,
    visible: boolean,
    loading: boolean,
    userEdited?: UserItem
}>()
const emit = defineEmits<{
    (e: 'onSave', payload: UserCreate): void
    (e: 'update:visible', value: boolean): void
}>()

const roleStore = useRoleStore()
const teamStore = useTeamStore()
const { fetchRoles } = roleStore
const { fetchTeams } = teamStore
const { roles } = storeToRefs(roleStore)
const { teams } = storeToRefs(teamStore)

const user = ref<{
	id: string,
	name: string,
	email: string,
	role?: Role,
	teams: TeamItem[]
}>({
    id: '',
    name: '',
	email: '',
	teams: []
})

const canSubmit = () => {
	return user.value.name && user.value.email && user.value.role
}

const onConfirm = () => {
    emit('onSave', {
		id: user.value.id,
		name: user.value.name,
		email: user.value.email,
		role: user.value.role?.name || '',
		team_ids: user.value.teams.map(t => t.id)
	})
}

const getRoles = computed(() => {
	return roles.value.map(role => ({
		id: role.id,
		name: role.name,
		is_internal: role.is_internal
	}))
})

watch(() => props.visible, () => {
    if (!props.visible) {
        return
    }

    fetchRoles()
    fetchTeams()

    if(props.userEdited) {
        user.value = {
            id: props.userEdited.id,
            name: props.userEdited.name,
			email: props.userEdited.email,
			role: props.userEdited.role,
            teams: props.userEdited.teams ? props.userEdited.teams : []
        }
    }
    else {
        user.value = {
            id: '',
			name: '',
			email: '',
			teams: []
        }
    }
})
</script>

<template>
    <Drawer 
		:visible="visible" 
		@update:visible="emit('update:visible', $event)" 
		class="w-[32rem]!" 
		:header="title" 
		position="right"
	>
		<Divider class="mt-2!" />

        <div class="flex flex-col gap-6 pt-6">
            <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label class="text-sm text-neutral-800! font-medium" for="name">{{ $t('users.name.label') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="user.name" 
                    :placeholder="$t('users.name.placeholder')" 
                    fluid
                    id="name"
                    name="name"
					size="small"
                />
            </div>

			<div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label class="text-sm text-neutral-800! font-medium" for="email">{{ $t('users.email.label') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="user.email" 
                    :placeholder="$t('users.email.placeholder')" 
                    fluid
                    id="email"
                    name="email"
					size="small"
                />
            </div>

            <div class="flex flex-col gap-1 relative">
				<div class="flex gap-1">
                    <label class="text-sm text-neutral-800! font-medium" for="users">{{ $t('users.role.label') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <Select
					v-model="user.role"
                    :options="getRoles"
                    :placeholder="$t('users.role.placeholder')"
					optionLabel="name"
                    class="w-full" 
                    size="small"
                />
            </div>

			<div class="flex flex-col gap-1 relative">
				<label class="text-sm text-neutral-800! font-medium" for="users">{{ $t('users.teams.label') }}</label>
                <MultiSelect
                    v-model="user.teams"
                    :options="teams"
                    optionLabel="name"
					display="chip"
                    :placeholder="$t('users.teams.placeholder')"
                    class="w-full" 
                    size="small"
                />
            </div>
		</div>

		<template #footer>
            <div class="flex justify-end gap-4">
                <Button class="bg-white! border-slate-200! hover:bg-slate-100!" severity="secondary"
                    @click="emit('update:visible', false)">
                    {{ $t('cancel') }}
                </Button>
                <Button 
					:disabled="loading || !canSubmit()"
					v-tooltip.top="!canSubmit() && {
						value: $t('users.create_user_tooltip'),
						class: 'text-sm max-w-[300px]!'
					}"
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