<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import type { DropdownOption, TemplateItem } from '~/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
    templates: TemplateItem[]
    loading: boolean
    showCreateCard?: boolean
    cardProps?: {
        clickable?: boolean,
        options?: DropdownOption[][]
    }
}>()

const emit = defineEmits<{
    (e: 'reach-end'): void,
    (e: 'select', template: TemplateItem): void
}>()

const sentinel = ref<HTMLElement | null>(null)

onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                emit('reach-end')
            }
        },
        { rootMargin: '200px' }
    )

    if (sentinel.value) {
        observer.observe(sentinel.value)
    }
})
</script>

<template>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
        <div v-if="showCreateCard"
            class="h-[340px] flex flex-col justify-between items-center rounded-md bg-slate-200 w-full">
            <div class="flex justify-center py-5 border-b-2 border-slate-300 w-full">
                <div class="font-bold text-2xl">
                    {{ t('templates.create_new_template') }}
                </div>
            </div>

            <Button class="w-[48px] h-[48px] bg-blue-500 hover:bg-blue-700"
                @click="$router.push({ name: 'new-template' })" rounded>
                <IconPlus size="32" class="text-white" />
            </Button>

            <div></div>
        </div>

        <TemplateCard 
            class="h-[340px] md:max-w-full" 
            v-for="template in templates" 
            :key="template.id"
            :template="template" 
            v-bind="cardProps"
            @click="(t: TemplateItem) => emit('select', t)"
        />
    </div>

    <div ref="sentinel" class="h-10" />

    <div v-if="loading" class="text-center font-semibold py-5">
        {{ t('loading') + '...' }}
    </div>
</template>
