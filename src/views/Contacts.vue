<script setup lang="ts">
import { IconUsers, IconLayoutGrid } from '@tabler/icons-vue'
</script>

<template>
    <div class="h-screen">
        <Tabs value="0" class="py-4" lazy>
            <TabList>
                <Tab value="0">
                    <div class="flex items-center gap-2 text-inherit">
                        <IconUsers size="16" />
                        <span class="text-sm">{{ $t('contacts.contacts_tab') }}</span>
                    </div>
                </Tab>
                <Tab value="1">
                    <div class="flex items-center gap-2 text-inherit">
                        <IconLayoutGrid size="16" />
                        <span class="text-sm">{{ $t('contacts.groups_tab') }}</span>
                    </div>
                </Tab>
            </TabList>
            <TabPanels class="p-6!">
                <TabPanel value="0">
                    <ContactTab />
                </TabPanel>
                <TabPanel value="1">
                    <ContactGroupsTab />
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>