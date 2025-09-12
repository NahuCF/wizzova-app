<script setup lang="ts">
import { IconLoader2 } from '@tabler/icons-vue'

defineProps<{
    visible: boolean,
    title: string,
    message: string,
    loading?: boolean,
    note?: string,
    confirmMessage?: string,
    cancelMessage?: string,
    unclosable?: boolean
}>()

const emit = defineEmits<{
    (e: 'onConfirm'): void,
    (e: 'onCancel'): void,
    (e: 'update:visible', value: boolean): void
}>()

const onCancel = () => {
    emit('update:visible', false)
    emit('onCancel')
}
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal
        :draggable="false"
        :closable="!unclosable"
        :header="title" 
        class="min-w-[25rem] max-w-[450px]"
    >
        <span class="text-lg text-surface-500 dark:text-surface-400 font-medium block mb-6">{{ message }}</span>
        <span v-if="note" class="text-surface-500 dark:text-surface-400 text-gray-600 block mb-8">{{ note }}</span>
        <slot name="note"></slot>
        <div class="flex justify-end gap-2">
            <Button v-if="!unclosable" type="button" severity="secondary" @click="onCancel">
                {{ cancelMessage ?? $t('cancel') }}
            </Button>
            <Button type="button" severity="danger" @click="emit('onConfirm')">
                <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                <span v-else>
                    {{ confirmMessage ?? $t('delete') }}
                </span>
            </Button>
        </div>
    </Dialog>
</template>