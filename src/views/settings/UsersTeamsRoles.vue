<script setup lang="ts">
import { IconPlus, IconSearch } from '@tabler/icons-vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDebounceFn } from '~/composables/useDebounceFn'
import { useRoleStore, useSessionStore, useTeamStore, useUserStore } from '~/stores'

const { hasPermission } = useSessionStore()
const userStore = useUserStore()
const teamStore = useTeamStore()
const roleStore = useRoleStore()

const { showCreateDialog: userDialog, selectedUser, search } = storeToRefs(userStore)
const { fetchUsers } = userStore
const { showCreateDialog: teamDialog, selectedTeam } = storeToRefs(teamStore)
const { showCreateDialog: roleDialog, selectedRole } = storeToRefs(roleStore)
const currentTab = ref('users')

const onCreate = () => {
    switch(currentTab.value) {
        case 'users':
            userDialog.value = true
            selectedUser.value = undefined
            break
        case 'teams':
            teamDialog.value = true
            selectedTeam.value = undefined
            break
        case 'roles':
            roleDialog.value = true
            selectedRole.value = undefined
            break
    }
}

const debouncedFetchUsers = useDebounceFn(() => fetchUsers(true), 500)
</script>

<template>
    <div class="flex flex-col h-full">
        <div class="px-6 pt-6 text-lg font-semibold">{{ $t('users_teams_roles.title') }}</div>
        <Tabs v-model:value="currentTab" class="py-4" lazy>
            <TabList>
                <Tab value="users">
                    <div class="flex items-center gap-2 text-inherit">
                        <span class="text-sm">{{ $t('users_teams_roles.users_tab') }}</span>
                    </div>
                </Tab>
                <Tab value="deleted_users">
                    <div class="flex items-center gap-2 text-inherit">
                        <span class="text-sm">{{ $t('users_teams_roles.deleted_users_tab') }}</span>
                    </div>
                </Tab>
                <Tab value="teams">
                    <div class="flex items-center gap-2 text-inherit">
                        <span class="text-sm">{{ $t('users_teams_roles.teams_tab') }}</span>
                    </div>
                </Tab>
                <Tab value="roles">
                    <div class="flex items-center gap-2 text-inherit">
                        <span class="text-sm">{{ $t('users_teams_roles.roles_tab') }}</span>
                    </div>
                </Tab>
                <div class="flex flex-col justify-center ms-auto">
                    <div class="flex gap-2">
                        <div v-if="currentTab === 'users'" class="relative">
                            <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <InputText
                                v-model="search"
                                class="pl-8! max-w-[180px] text-sm! shadow-none!"
                                name="search"
                                id="search"
                                fluid
                                :placeholder="$t('search')"
                                @input="debouncedFetchUsers()"
                            />
                        </div>
                        <Button v-if="currentTab !== 'deleted_users' && hasPermission('settings.manage_user_roles_and_teams')" @click="onCreate()">
                            <IconPlus size="16" class="mr-1" />
                            <span class="text-sm">
                                {{ $t(`${currentTab}.add`) }}
                            </span>
                        </Button>
                    </div>
                </div>
            </TabList>
            <TabPanels class="p-6!">
                <TabPanel value="users">
                    <UsersTab />
                </TabPanel>
                <TabPanel value="deleted_users">
                    <DeletedUsersTab />
                </TabPanel>
                <TabPanel value="teams">
                    <TeamsTab />
                </TabPanel>
                <TabPanel value="roles">
                    <RolesTab />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>