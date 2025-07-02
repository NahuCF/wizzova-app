<script setup lang="ts">
import { defineProps, defineEmits, type Component } from 'vue'
import { IconMinus, IconPlus } from '@tabler/icons-vue'

const props = defineProps<{
    modelValue: string[]
    fieldName: string
    isGrouped?: boolean
    placeholder?: string,
    icon?: Component,
    invalid?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
}>()

const removeItem = (index: number) => {
    if (props.modelValue.length > 1) {
        const newValue = [...props.modelValue]
        newValue.splice(index, 1)
        emit('update:modelValue', newValue)
    }
}

const addItem = () => {
    const newValue = [...props.modelValue, '']
    emit('update:modelValue', newValue)
}

const onInput = (index: number, event: Event) => {
    const target = event.target as HTMLInputElement | null
    if (!target) return
    const newValue = [...props.modelValue]
    newValue[index] = target.value
    emit('update:modelValue', newValue)
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div v-for="(item, index) in modelValue" :key="`${fieldName}_${index}`" class="flex gap-2.5">
            <InputGroup>
                <InputGroupAddon v-if="isGrouped">
                    <component :is="icon" class="w-[14px] h-[14px]" />
                </InputGroupAddon>
                <InputText 
                    :id="`${fieldName}_${index}`" 
                    :name="fieldName" 
                    fluid 
                    class="shadow-none!"
                    :placeholder="placeholder" 
                    :value="item"
                    :invalid="invalid"
                    size="small"
                    @input="onInput(index, $event)" 
                />
            </InputGroup>

            <Button class="bg-white! border-slate-300! hover:border-slate-400!" severity="secondary"
                @click.stop="removeItem(index)">
                <IconMinus size="14" />
            </Button>

            <Button class="bg-white! border-slate-300! hover:border-slate-400!" severity="secondary"
                @click.stop="addItem">
                <IconPlus size="14" />
            </Button>
        </div>
    </div>
</template>
