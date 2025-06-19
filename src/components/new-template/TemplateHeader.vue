<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { API } from '~/services'
import { useTemplateStore } from '~/stores'
import type { TemplateHeaderType } from '~/types'
import { IconInfoCircle } from '@tabler/icons-vue'

const templateStore = useTemplateStore()
const { t } = useI18n()

const headerTypes = ref<TemplateHeaderType[]>([])

const fullHeaderTypes = computed(() => {
    return [
        {
            id: '',
            name: 'None',
            code: 'NONE'
        },
        ...headerTypes.value
    ]
})

const fetchHeaderComponentTypes = async () => {
  const response = await API.templateHeader.headerTypes()
  headerTypes.value = response.data.data
}

watch(() => templateStore.template.header.type, () => {
    templateStore.template.header.text = ''
})

fetchHeaderComponentTypes()
</script>

<template>
    <div>
        <div class="flex items-center gap-2 mb-2">
            <h2 class="font-medium text-lg">{{ $t('header') }}</h2>
            <IconInfoCircle class="text-slate-700 hover:cursor-pointer" size="16"
                v-tooltip="t('header_tooltip')" />
            <Badge severity="secondary">{{ $t('optional') }}</Badge>
        </div>
        <div class="flex flex-wrap gap-4">
            <div v-for="headerType in fullHeaderTypes" :key="headerType.id" class="flex items-center gap-2">
                <RadioButton v-model="templateStore.template.header.type" :inputId="headerType.id" :value="headerType.code" />
                <label :for="headerType.id">{{ $t(`header_type.${headerType.code}`) }}</label>
            </div>
        </div>

        <div v-if="templateStore.template.header.type === 'TEXT'" class="relative mt-3">
            <InputText v-model="templateStore.template.header.text" class="!pr-[5.5rem]" name="header" id="header" fluid
                :maxlength="60" :placeholder="$t('header_placeholder')" />
            <div class="absolute right-3 top-2 text-slate-400">
                {{ templateStore.template.header.text.length }} / 60
            </div>
        </div>
    </div>
</template>