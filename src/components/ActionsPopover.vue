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

defineExpose({ show })
</script>

<template>
    <Popover ref="popoverRef" class="min-w-[15rem]">
        <div class="pt-3 pb-2">
            <ul class="list-none p-0 m-0 flex flex-col">
                <template v-for="(optionList, index) in options" :key="index">
                    <li v-for="option in optionList" :key="option.label"
                        class="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-100 cursor-pointer"
                        :class="option.class ?? ''" @click="select(option)">
                        <component :is="option.icon" class="w-[16px] h-[16px]" />
                        {{ $t(option.label) }}
                    </li>
                    <Divider v-if="index !== options.length - 1" class="my-2.5!" />
                </template>
            </ul>
        </div>
    </Popover>
</template>