<script setup lang="ts">
defineProps<{
    visible: boolean
}>()
const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()
</script>

<template>
    <Drawer :visible="visible" @update:visible="emit('update:visible', $event)" class="w-[32rem]!" :header="$t('contacts.add_contact')" position="right">

    </Drawer>
</template>