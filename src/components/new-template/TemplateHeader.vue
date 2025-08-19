<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { API } from '~/services'
import type { TemplateHeaderCode, TemplateHeaderType } from '~/types'
import { IconInfoCircle } from '@tabler/icons-vue'

const props = defineProps<{
    type: TemplateHeaderCode,
    text: string
}>()

const emit = defineEmits<{
    (e: 'update:type', type: TemplateHeaderCode): void,
    (e: 'update:text', text: string): void
}>()

const { t } = useI18n()

const headerTypes = ref<TemplateHeaderType[]>([])

const fullHeaderTypes = computed(() => {
    return [
        {
            id: '',
            name: 'None',
            code: 'NONE'
        },
        ...headerTypes.value.filter(ht => ht.code === 'TEXT')
    ]
})

const fetchHeaderComponentTypes = async () => {
    const response = await API.templateHeader.headerTypes()
    headerTypes.value = response.data.data
}

const changeType = (type: TemplateHeaderCode) => {
    emit('update:type', type)
    emit('update:text', '')
}

fetchHeaderComponentTypes()
</script>

<template>
    <div>
        <div class="flex items-center gap-2 mb-4">
            <h2 class="font-medium text-xl">{{ $t('header') }}</h2>
            <div v-tooltip.bottom="{
                value: t('header_tooltip'),
                class: 'text-sm max-w-[250px]!'
            }">
                <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="16" />
            </div>
            <Badge severity="secondary" class="text-base!">{{ $t('optional') }}</Badge>
        </div>
        <div class="flex flex-wrap gap-4">
            <div v-for="headerType in fullHeaderTypes" :key="headerType.id" class="flex items-center gap-2">
                <RadioButton
                    :modelValue="type"
                    @update:modelValue="(value) => changeType(value)" 
                    :inputId="headerType.code"
                    :value="headerType.code"
                />
                <label class="text-xl cursor-pointer" :for="headerType.code">{{ $t(`header_type.${headerType.code}`) }}</label>
            </div>
        </div>

        <div v-if="type === 'TEXT'" class="relative mt-3">
            <InputText 
                :modelValue="text" 
                @update:modelValue="(value) => emit('update:text', value || '')"
                class="!pr-[5.5rem]" 
                name="header" 
                id="header" 
                fluid 
                :maxlength="60"
                :placeholder="$t('header_placeholder')"
            />
            <div class="absolute right-3 top-2 text-slate-400">
                {{ text.length }} / 60
            </div>
        </div>
    </div>
</template>