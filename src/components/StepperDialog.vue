<script setup lang="ts">
import {
    IconNumber0, IconNumber1, IconNumber2, IconNumber3, IconNumber4,
    IconNumber5, IconNumber6, IconNumber7, IconNumber8, IconNumber9,
    IconCheck, IconLoader2
} from '@tabler/icons-vue'
import { watch, defineProps, defineEmits, computed } from 'vue'
import { useRouter } from 'vue-router';

const props = defineProps<{
    visible: boolean
    currentStep: number,
    stepTitles: string[],
    loading: boolean,
    nextDisabled: boolean,
    stepValidate: () => Promise<boolean> | boolean,
    nextLabel?: string
    backLabel?: string
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'update:currentStep', value: number): void
}>()

const router = useRouter()

const currentStep = computed({
    get: () => props.currentStep,
    set: (val: number) => emit('update:currentStep', val)
})

const goNext = async () => {
    if (currentStep.value < props.stepTitles.length) {
        if(await props.stepValidate()) {
            currentStep.value++
        }
    } else {
        emit('update:visible', false)
    }
}

const goBack = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const reset = () => {
    currentStep.value = 1
}

watch(() => props.visible, (val) => {
    if (!val) reset()
})

const digitIconMap: Record<string, any> = {
    '0': IconNumber0,
    '1': IconNumber1,
    '2': IconNumber2,
    '3': IconNumber3,
    '4': IconNumber4,
    '5': IconNumber5,
    '6': IconNumber6,
    '7': IconNumber7,
    '8': IconNumber8,
    '9': IconNumber9,
}
</script>

<template>
    <Dialog :visible="visible" modal :closable="false" :showHeader="false" contentClass="p-0! h-full"
        class="min-w-[25rem] max-w-[1088px] w-full h-[668px]" @update:visible="emit('update:visible', $event)">
        <div class="flex h-full">

            <aside class="flex flex-col bg-slate-50 rounded-xl min-w-[260px]">
                <div class="px-8 py-6 font-bold text-slate-500">
                    <slot name="title" />
                </div>

                <div class="flex flex-col gap-8 px-[18px] pb-6 text-lg">
                    <div class="text-slate-500 text-base">
                        <slot name="subtitle" />
                    </div>

                    <div v-for="(title, i) in stepTitles" :key="i"
                        class="flex items-center gap-2 font-semibold text-slate-500">
                        <div class="p-2 rounded-full flex justify-center items-center" :class="{
                            'bg-emerald-500 text-white': currentStep === i + 1,
                            'bg-white shadow-sm': currentStep < i + 1,
                            'bg-slate-200 text-white': currentStep > i + 1,
                        }" style="width: 32px; height: 32px;">
                            <component v-if="currentStep > i + 1" :is="IconCheck" class="text-emerald-500" size="18" />
                            <template v-else>
                                <div class="flex gap-[2px] justify-center items-center">
                                    <component v-for="(digit, idx) in String(i + 1).split('')" :key="idx"
                                        :is="digitIconMap[digit]" size="18" class="text-current" />
                                </div>
                            </template>
                        </div>
                        {{ title }}
                    </div>
                </div>
            </aside>


            <section class="flex flex-col justify-between w-full h-full px-8 py-6">
                <div class="h-full">
                    <slot :name="`step-${currentStep}`" />
                </div>


                <div class="flex justify-end gap-2 mt-6">
                    <Button 
                        v-if="currentStep !== 3" 
                        class="bg-white! border-slate-200! hover:bg-slate-100!" 
                        severity="secondary" 
                        @click="emit('update:visible', false)"
                    >
                        <span>
                            {{ $t('contacts.import_dialog.cancel') }}
                        </span>
                    </Button>

                    <Button
                        v-if="currentStep === 3"
                        variant="outlined"
                        @click="router.push({ name: 'contacts-import' })"
                    >
                        <span>{{ $t('contacts.import_dialog.go_to_history') }}</span>
                    </Button>

                    <Button v-if="currentStep > 1 && currentStep !== 3" severity="secondary"
                        @click="goBack">
                        <span>
                            {{ backLabel || 'Back' }}
                        </span>
                    </Button>

                    <Button @click="goNext" :disabled="nextDisabled">
                        <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                        <span v-else>
                            {{ nextLabel || 'Next' }}
                        </span>
                    </Button>
                </div>
            </section>
        </div>
    </Dialog>
</template>
