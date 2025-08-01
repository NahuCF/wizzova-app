<script setup lang="ts">

defineProps<{
    visible: boolean,
    title: string,
    message: string,
    note?: string,
    confirmMessage?: string
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
        :header="title" 
        class="min-w-[25rem] max-w-[450px]"
    >
        <span class="text-surface-500 dark:text-surface-400 font-medium block mb-4">{{ message }}</span>
        <span v-if="note" class="text-surface-500 dark:text-surface-400 text-gray-600 block mb-8">{{ note }}</span>
        <div class="flex justify-end gap-2">
            <Button type="button" severity="secondary" @click="emit('update:visible', false)">{{ $t('cancel') }}</Button>
            <Button type="button" severity="danger" @click="emit('onConfirm')">{{ confirmMessage ? confirmMessage : $t('delete') }}</Button>
        </div>
    </Dialog>
</template>