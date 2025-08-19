<script setup lang="ts">
import { IconAntennaBars5, IconXboxX } from '@tabler/icons-vue'
import { computed } from 'vue'
import type { TemplateStatus } from '~/types';

const props = defineProps<{
    status: TemplateStatus,
    label: string
}>()

const badgeStatusStyles = {
	PENDING: {
		icon: IconAntennaBars5,
		color: 'text-green-600',
		backgroundColor: 'bg-green-200'
	},
	REJECTED: {
		icon: IconXboxX,
		color: 'text-red-600',
		backgroundColor: 'bg-red-200'
	}
}

const badgeStyle = computed(() => {
  return badgeStatusStyles[props.status]
})
</script>

<template>
    <div>
        <div :class="`flex justify-between items-center gap-1 text-base px-1 py-0.5 rounded-sm ${badgeStyle.color} ${badgeStyle.backgroundColor}`">
            <component
                :is="badgeStyle.icon"
                class="w-[16px] h-[16px]"
            />
            {{ label }}
        </div>
    </div>
</template>