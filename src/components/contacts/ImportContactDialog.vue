<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { API } from '~/services'
import { IconCircleCheck, IconUsers } from '@tabler/icons-vue'
import type { MappingContact, ContactFieldItem } from '~/types'
import { useContactFieldStore } from '~/stores'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const { t } = useI18n()
const router = useRouter()
const contactFieldStore = useContactFieldStore()

const currentStep = ref(1)
const mappingRows = ref<MappingContact[]>([])
const renamedFileName = ref<string | null>(null)
const uploadedFile = ref<File | null>(null)
const importMode = ref<'ADD' | 'ADD_AND_REPLACE'>('ADD')
const validationErrors = ref<string[]>([])
const submitting = ref(false)

const stepTitles = computed(() => [
    t('contacts.import_dialog.upload_file'),
    t('contacts.import_dialog.map_columns'),
    t('contacts.import_dialog.confirm_import'),
])

const nextLabel = computed(() => {
    switch (currentStep.value) {
        case 1: return t('contacts.import_dialog.map_columns')
        case 2: return t('contacts.import_dialog.map_columns')
        default: return t('contacts.import_dialog.confirm_import')
    }
})

const isNextDisabled = computed(() => {
    return (currentStep.value === 1 && !mappingRows.value.length)
        || (currentStep.value === 2 && validationErrors.value.length > 0)
})

const contactFields = computed(() => {
    if(importMode.value === 'ADD_AND_REPLACE') {
        return [
            {
                id: '',
                name: 'ID',
                internal_name: 'id',
                type: 'TEXT',
                is_mandatory: false,
                is_active: true,
                is_primary_field: true 
            },
            ...contactFieldStore.contactFields
        ]
    }

    return contactFieldStore.contactFields
})

const onStepChange = async (newStep: number) => {
    if (newStep === 2) {
        validateMappings()
        if (validationErrors.value.length > 0) {
            currentStep.value = 1
            return
        }
    }

    if (newStep === 3) {
        if (validationErrors.value.length > 0) {
            currentStep.value = 2
            return
        }
        const success = await submitImport()
        if (!success) {
            currentStep.value = 2
            return
        }
    }

    currentStep.value = newStep
}

const validateMappings = () => {
    validationErrors.value = []
    const mapped = mappingRows.value
        .map(row => row.contactField?.name)
        .filter((name): name is string => !!name)

    const mappedLower = mapped.map(f => f.toLowerCase())
    if (!mappedLower.includes('name')) {
        validationErrors.value.push(t('contacts.import_dialog.required_field_missing', { field: 'name' }))
    }
    if (!mappedLower.includes('phone')) {
        validationErrors.value.push(t('contacts.import_dialog.required_field_missing', { field: 'phone' }))
    }

    const counts: Record<string, number> = {}
    mappingRows.value.forEach(r => {
        const name = r.contactField?.name
        if (!name) return
        counts[name] = (counts[name] || 0) + 1
    })
    for (const [field, count] of Object.entries(counts)) {
        if (count > 1) {
            validationErrors.value.push(t('contacts.import_dialog.duplicated_field', { field }))
        }
    }
}

const submitImport = async () => {
    submitting.value = true
    try {
        let file = uploadedFile.value
        if (!file) return false

        const originalName = file.name.replace(/\.[^/.]+$/, '')
        if (renamedFileName.value && renamedFileName.value !== originalName) {
            file = new File([file], `${renamedFileName.value}.${file.name.split('.').pop()}`, {
                type: file.type,
                lastModified: file.lastModified,
            })
        }

        const mappings = mappingRows.value
            .filter(row => row.contactField && row.contactField?.internal_name.toLowerCase() !== 'id')
            .map(row => ({
                name: row.excelColumn,
                id: row.contactField!.id,
            }))

        await API.contact.importContacts(file, renamedFileName.value || originalName, importMode.value, mappings)
        return true
    } catch (error) {
        console.error(error)
        validationErrors.value.push(t('contacts.import_dialog.import_failed'))
        return false
    } finally {
        submitting.value = false
    }
}

watch(() => props.visible, (val) => {
    if (!val) {
        currentStep.value = 1
        mappingRows.value = []
        renamedFileName.value = null
        uploadedFile.value = null
        importMode.value = 'ADD'
        validationErrors.value = []
    }
})

watch(() => contactFieldStore.contactFields, () => {
    if(contactFieldStore.contactFields.length === 0) {
        contactFieldStore.fetchContactFields()
    }
})

watch(mappingRows, validateMappings)
</script>

<template>
    <StepperDialog 
        :visible="props.visible" 
        @update:visible="emit('update:visible', $event)" 
        :steps="stepTitles"
        :loading="submitting" 
        :next-disabled="isNextDisabled" 
        :next-label="nextLabel"
        :back-label="t('contacts.import_dialog.back')" 
        @step-change="onStepChange"
    >
        <template #title>
            <div class="flex items-center gap-2">
                <IconUsers size="14" />
                {{ t('contacts.import_dialog.title') }}
            </div>
        </template>

        <template #subtitle>
            {{ t('contacts.import_dialog.steps_title') }}
        </template>

        <template #step-1>
            <Step1UploadFile
                v-model:file="uploadedFile"
                v-model:renamedFileName="renamedFileName"
                v-model:importMode="importMode"
                v-model:mappingRows="mappingRows"
                :mappingLoaded="mappingRows.length > 0"
                :contact-fields="contactFields"
            />
        </template>

        <template #step-2>
            <Step2MapColumns 
                v-model:mappingRows="mappingRows" 
                :contact-fields="contactFields"
                :validationErrors="validationErrors" 
            />
        </template>

        <template #step-3>
            <div class="flex flex-col justify-center h-full">
                <div class="flex items-center gap-2 text-slate-500 font-bold text-base pb-4">
                    {{ t('contacts.import_dialog.step3_title') }}
                    <IconCircleCheck class="text-emerald-500" size="22" />
                </div>
                <div class="text-sm pb-5">
                    {{ t('contacts.import_dialog.step3_hint') }}
                </div>
                <div class="pb-4">
                    <Button variant="link" class="underline p-0!" @click="router.push('/contacts/import/history')">
                        <span class="text-sm">{{ t('contacts.import_dialog.go_to_history') }}</span>
                    </Button>
                </div>
            </div>
        </template>
    </StepperDialog>
</template>

<style scoped>
:deep(.p-fileupload) {
    border: none !important;
}

:deep(.p-fileupload-header) {
    display: none;
}

:deep(.p-fileupload-content) {
    padding: 0;
}
</style>
