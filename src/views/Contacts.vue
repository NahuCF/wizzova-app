<script setup lang="ts">
import { IconUsers, IconLayoutGrid } from '@tabler/icons-vue'
</script>

<template>
    <div class="h-screen">
        <Tabs value="0" class="py-4">
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
                        <span class="text-sm">{{ $t('contacts.segments_tab') }}</span>
                    </div>
                </Tab>
            </TabList>
            <TabPanels class="p-6!">
                <TabPanel value="0">
                    <ContactTab />
                </TabPanel>
                <TabPanel value="1">
                    Todo segments
                </TabPanel>
            </TabPanels>
        </Tabs>
    </div>
</template>

<style lang="css" scoped>
:deep(.p-tabs),
:deep(.p-tabpanels),
:deep(.p-tabpanel) {
  height: 100%;
  overflow: hidden;
}

:deep(.p-tablist-tab),
:deep(.p-tabpanels),
:deep(.p-tabpanel) {
    background: transparent;
    border: none;
}

:deep(.p-tablist-tab-list) {
    background: transparent;
    padding: 0 1.5rem;
    border-bottom: 1px solid var(--p-tabs-tab-hover-border-color);
}
</style>