<script setup lang="ts">
import { IconDotsVertical } from '@tabler/icons-vue';

const emit = defineEmits(['click'])
</script>

<template>
    <Button
        class="bg-white! hover:bg-slate-200! p-1! border-1! border-slate-300! font-semibold! text-slate-500!"
        @click="(e) => emit('click', e)"
    >
        <IconDotsVertical size="13"  />
    </Button>
</template>