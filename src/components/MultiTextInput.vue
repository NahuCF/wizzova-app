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

const updateItem = (index: number, value: string) => {
    const newValue = [...props.modelValue]
    newValue[index] = value
    emit('update:modelValue', newValue)
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div v-for="(item, index) in modelValue" :key="`${fieldName}_${index}`" class="flex gap-2.5">
            <slot
                name="input"
                :modelValue="item"
                :index="index"
                :update="(val: string) => updateItem(index, val)"
                :fieldName="fieldName"
                :placeholder="placeholder"
                :invalid="invalid"
            >

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
                        @input="(event: Event) => {
                            const target = event.target as HTMLInputElement
                            updateItem(index, target.value)
                        }"
                    />
                </InputGroup>
            </slot>

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
