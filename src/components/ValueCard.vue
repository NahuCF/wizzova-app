<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
    icon: Component,
    colorClass: string,
    label: string,
    count: number,
    percentage?: number,
    loading?: boolean
}>()
</script>

<template>
    <div class="p-4 bg-white border border-slate-200 rounded-lg flex flex-col gap-3 text-sm">
        <div class="flex gap-2 items-center">
            <component :is="icon" class="w-[20px] h-[20px]" :class="[colorClass, loading && 'opacity-20']" />
            <div class="font-normal text-gray-500">
                <span v-if="!loading">{{ label }}</span>
                <div v-else class="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
        </div>

        <div class="flex gap-2 items-baseline">
            <div class="text-lg font-bold">
                <span v-if="!loading">{{ count }}</span>
                <div v-else class="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>

            <span v-if="percentage && !loading" class="text-sm font-normal text-gray-500">({{ percentage }}%)</span>
            <div v-else-if="percentage && loading" class="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
        </div>
    </div>
</template>
