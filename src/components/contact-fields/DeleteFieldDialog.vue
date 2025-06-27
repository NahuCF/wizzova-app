<script setup lang="ts">

defineProps<{
    visible: boolean
}>()

const emit = defineEmits<{
    (e: 'onConfirm'): void,
    (e: 'update:visible', value: boolean): void
}>()
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal
        :draggable="false"
        :header="$t('contact_fields.delete_field')" 
        class="min-w-[25rem] max-w-[450px]"
    >
        <span class="text-surface-500 dark:text-surface-400 font-medium block mb-4">{{ $t('contact_fields.delete_message') }}</span>
        <span class="text-surface-500 dark:text-surface-400 text-gray-600 block mb-8">{{ $t('contact_fields.delete_note') }}</span>
        <div class="flex justify-end gap-2">
            <Button type="button" severity="secondary" @click="emit('update:visible', false)">{{ $t('cancel') }}</Button>
            <Button type="button" @click="emit('onConfirm')">{{ $t('delete') }}</Button>
        </div>
    </Dialog>
</template>