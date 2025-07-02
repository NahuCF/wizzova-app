<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { IconPlus, IconX } from '@tabler/icons-vue'

const props = defineProps<{
    modelValue: string[]
    placeholder?: string
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void
}>()

const isAddingTag = ref(false)
const newTag = ref('')
const tagInput = ref()

const showTagInput = () => {
    isAddingTag.value = true
    nextTick(() => {
        const inputEl = tagInput.value?.$el as HTMLInputElement | null
        inputEl?.focus()
    })
}

const addTag = () => {
    const tag = newTag.value.trim()
    if (tag && !props.modelValue.includes(tag)) {
        emit('update:modelValue', [...props.modelValue, tag])
    }
    newTag.value = ''
    isAddingTag.value = false
}

const removeTag = (index: number) => {
    const updated = [...props.modelValue]
    updated.splice(index, 1)
    emit('update:modelValue', updated)
}
</script>

<template>
    <div class="flex flex-col gap-2">
        <div class="flex items-center flex-wrap gap-2">
            <Tag v-for="(tag, index) in modelValue" :key="`tag-${index}`"
                class="px-2 py-1 rounded-full">
                <div class="flex items-center gap-1">
                    <span>{{ tag }}</span>
                    <IconX 
                        size="14" 
                        class="cursor-pointer" 
                        role="button" 
                        tabindex="0" 
                        @click="removeTag(index)"
                        @keydown.enter.prevent="removeTag(index)" 
                        aria-label="Remove tag" 
                    />
                </div>
            </Tag>

            <Button class="text-primary text-sm! underline" severity="secondary" variant="link" @click="showTagInput">
                <IconPlus size="16" />
                <span>{{ $t('contacts.add_tag') }}</span>
            </Button>
        </div>

        <InputText v-if="isAddingTag" v-model="newTag" @keyup.enter="addTag" @blur="addTag"
            :placeholder="placeholder || $t('contacts.placeholder.tag')" class="text-sm w-full max-w-xs"
            ref="tagInput" />
    </div>
</template>
