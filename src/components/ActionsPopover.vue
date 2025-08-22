<script setup lang="ts">
import { ref } from 'vue'
import type { DropdownOption } from '~/types'

defineProps<{
    options: DropdownOption[][]
}>()

const popoverRef = ref()
const selectedItem = ref<any>(null)

const show = (event: MouseEvent, item?: any) => {
    selectedItem.value = item
    popoverRef.value?.toggle(event)
}

const select = (option: DropdownOption) => {
    popoverRef.value?.hide()
    option.action(selectedItem.value)
}

const isDisabled = (option: DropdownOption) => {
    return option.disabled ? option.disabled(selectedItem.value) : false
}

defineExpose({ show })
</script>

<template>
    <Popover ref="popoverRef" class="min-w-[15rem]">
        <div class="pt-3 pb-2">
            <ul class="list-none p-0 m-0 flex flex-col">
                <template v-for="(optionList, index) in options" :key="index">
                    <li 
                        v-for="option in optionList" :key="option.label"
                        class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-100"
                        :class="[
                            option.class ?? '',
                            isDisabled(option) ? 'opacity-50 hover:bg-transparent cursor-default' : 'cursor-pointer'
                        ]"
                        @click="!isDisabled(option) && select(option)"
                        v-tooltip.bottom="option.tooltip && {
                            value: option.tooltip(selectedItem),
                            class: 'text-base max-w-[300px]!'
                        }"
                    >
                        <component :is="option.icon" class="w-[16px] h-[16px]" :class="option.iconClass" />
                        {{ $t(option.label) }}
                    </li>
                    <Divider v-if="index !== options.length - 1" class="my-2.5!" />
                </template>
            </ul>
        </div>
    </Popover>
</template>