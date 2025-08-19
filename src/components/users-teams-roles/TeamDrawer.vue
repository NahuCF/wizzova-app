<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconAsterisk, IconLoader2, IconTrash } from '@tabler/icons-vue'
import type { TeamCreate, TeamItem, UserItem } from '~/types'
import { useUserStore } from '~/stores'
import { storeToRefs } from 'pinia'

const props = defineProps<{
	title: string,
    visible: boolean,
    loading: boolean,
    teamEdited?: TeamItem
}>()
const emit = defineEmits<{
    (e: 'onSave', payload: TeamCreate): void
    (e: 'update:visible', value: boolean): void
}>()

const userStore = useUserStore()
const { fetchUsers } = userStore
const { users } = storeToRefs(userStore)

const team = ref<{
	id: string,
	name: string,
	users: UserItem[]
}>({
    id: '',
    name: '',
    users: []
})
const emptySelect = ref([])

const canSubmit = () => {
    return team.value.name
}

const onConfirm = () => {
    emit('onSave', {
		id: team.value.id,
		name: team.value.name,
		user_ids: team.value.users.map(user => user.id)
	})
}

const addUser = ({ value }: { value: UserItem }) => {
    emptySelect.value = []

    const inList = team.value.users.find(u => u.id === value.id)
    if(!inList) {
        team.value.users = [
            ...team.value.users,
            value
        ]
    }
}

const removeUser = (id: string) => {
    team.value.users = team.value.users.filter(u => u.id !== id)
}

watch(() => props.visible, () => {
    if (!props.visible) {
        return
    }

    fetchUsers()

    if(props.teamEdited) {
        team.value = {
            id: props.teamEdited.id,
            name: props.teamEdited.name,
            users: props.teamEdited.users
        }
    }
    else {
        team.value = {
            id: '',
            name: '',
            users: []
        }
    }
})
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
                    <label class="text-neutral-800! font-medium" for="name">{{ $t('teams.name.label') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="team.name" 
                    :placeholder="$t('teams.name.placeholder')" 
                    fluid
                    id="name"
                    name="name"
                />
            </div>

            <div class="flex flex-col gap-1 relative">
                <label class="text-neutral-800! font-medium" for="users">{{ $t('teams.users.label') }}</label>
                
                <Select
                    v-model="emptySelect"
                    @change="addUser"
                    filter
                    :options="users"
                    optionLabel="name"
                    :placeholder="$t('teams.users.placeholder')"
                    class="w-full" 
                />

                <DataTable 
                    :value="team.users" 
                    dataKey="id" 
                    class="rounded-lg overflow-hidden mt-2" 
                    :loading="loading" 
                    :totalRecords="team.users.length" 
                    scrollable
                    scrollHeight="flex"
                >
                    <template #empty>
                        <div class="text-center text-base py-4 text-gray-500">
                            {{ $t('users.empty') }}
                        </div>
                    </template>

                    <Column headerClass="bg-slate-200!">
                        <template #header>
                            <div class="uppercase text-base font-semibold">
                                {{ $t(`users.headers.name`) }}
                            </div>
                        </template>

                        <template #body="{ data }: { data: UserItem }">
                            <span class="block whitespace-nowrap overflow-hidden text-ellipsis text-base">
                                {{ data.name }}
                            </span>
                        </template>
                    </Column>

                    <Column bodyClass="max-w-[30px]" headerClass="bg-slate-200! max-w-[60px]">
                        <template #header>
                            <div class="uppercase text-base font-semibold">
                                {{ $t(`teams.headers.actions`) }}
                            </div>
                        </template>

                        <template #body="{ data }: { data: UserItem }">
                            <IconTrash class="text-red-600 w-[16px] h-[16px] cursor-pointer" @click="removeUser(data.id)" />
                        </template>
                    </Column>
                </DataTable>
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
						value: $t('teams.create_team_tooltip'),
						class: 'text-base max-w-[300px]!'
					}"
                    @click="onConfirm" 
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