<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
    IconCloudUpload
} from '@tabler/icons-vue'
import { FileUpload, Button, InputText, RadioButton } from 'primevue'
import { useExcelParser } from '~/composables/useExcelParser'
import type { ContactFieldItem, ContactImportMode, MappingContact } from '~/types'

const props = defineProps<{
    file: File | null,
    renamedFileName: string | null,
    importMode: ContactImportMode,
    mappingRows: MappingContact[],
    contactFields: ContactFieldItem[],
    mappingLoaded: boolean
}>()

const emit = defineEmits([
    'update:file',
    'update:renamedFileName',
    'update:importMode',
    'update:mappingRows',
    'file-selected',
])

const { parseExcelFile } = useExcelParser()

const fileUploadRef = ref()
const localRenamedFileName = ref(props.renamedFileName ?? '')

const fileSize = computed(() => {
    if (!props.file) return null
    const size = props.file.size
    if (size < 1024) return `${size} bytes`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
})

const onClickDropArea = () => {
    const input = fileUploadRef.value?.$el.querySelector('input[type="file"]')
    input?.click()
}

const onFileSelect = async (event: any) => {
    const file = event.files?.[0]
    if (!file) return

    emit('update:file', file)
    emit('update:renamedFileName', file.name.replace(/\.[^/.]+$/, ''))

    const { headers, rows } = await parseExcelFile(file)
    const sampleRow = rows[0]

    const mappingRows = headers.map((column) => {
        const rawValue = sampleRow[column]
        const matched = props.contactFields.find(
            f => f.internal_name.trim().toLowerCase() === column.trim().toLowerCase()
        )

        return {
            excelColumn: column,
            value: rawValue,
            contactField: matched ?? null,
            status: matched ? 'MAPPED' : 'NOT_MAPPED',
        }
    })

    emit('update:mappingRows', mappingRows)
}

const downloadSample = () => {
    const blob = new Blob([''], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'sample.xlsx'
    a.click()

    URL.revokeObjectURL(url)
}

const onRenamedFileNameChange = (val: string | undefined) => {
    localRenamedFileName.value = val ?? ''
    emit('update:renamedFileName', val ?? null)
}

watch(() => props.renamedFileName, (newVal) => {
    localRenamedFileName.value = newVal ?? ''
})

watch(() => props.importMode, () => {
    const mappingRows = props.mappingRows.map((row) => {
        const matched = props.contactFields.find(
            f => f.internal_name.trim().toLowerCase() === row.excelColumn.trim().toLowerCase()
        )

        return {
            excelColumn: row.excelColumn,
            value: row.value,
            contactField: matched ?? null,
            status: matched ? 'MAPPED' : 'NOT_MAPPED',
        }
    })

    emit('update:mappingRows', mappingRows)
})
</script>

<template>
    <div>
        <div class="text-slate-500 font-bold text-base pb-3">
            {{ $t('contacts.import_dialog.step1_title') }}
        </div>
        <div class="text-sm pb-6">
            {{ $t('contacts.import_dialog.step1_hint') }}
        </div>
        <div class="pb-4">
            <Button variant="link" class="underline ps-0! text-sm!" @click="downloadSample">
                {{ $t('contacts.import_dialog.download_sample') }}
            </Button>
        </div>

        <FileUpload v-if="!props.mappingLoaded" ref="fileUploadRef" name="contacts" accept=".xlsx,.xls,.csv"
            :maxFileSize="25000000" customUpload :auto="false" :showUploadButton="false" :showCancelButton="false"
            @select="onFileSelect">
            <template #content>
                <div class="h-[416px] flex flex-col justify-center items-center text-sm border-1 border-emerald-500 rounded-lg text-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition"
                    @click="onClickDropArea">
                    <IconCloudUpload size="20" class="text-emerald-500 mb-3" />
                    <div>{{ $t('contacts.import_dialog.browse_hint') }}</div>
                    <div>{{ $t('contacts.import_dialog.supported_formats') }}</div>
                </div>
            </template>
        </FileUpload>

        <div v-else>
            <label class="text-xs font-normal! text-slate-500 mb-1.5">
                {{ $t('contacts.import_dialog.imported_file') }}:
            </label>
            <div class="flex flex-col gap-2 py-7 px-4 bg-slate-50 border-slate-400 border-1 rounded-md text-sm">
                <div class="block font-medium text-slate-700">{{ props.file?.name }}</div>
                <div v-if="fileSize" class="text-slate-500">{{ fileSize }}</div>
            </div>

            <div class="mt-4">
                <label class="text-xs font-normal! text-slate-500 mb-1.5">
                    {{ $t('contacts.import_dialog.rename_imported_file') }}:
                </label>
                <InputText
                    :modelValue="localRenamedFileName"
                    class="w-full"
                    size="small"
                    @update:modelValue="onRenamedFileNameChange"
                />
            </div>

            <div class="mt-4">
                <div class="flex flex-col gap-5 text-sm">
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="addOnly" name="mode" value="ADD" :modelValue="props.importMode"
                            @update:modelValue="val => emit('update:importMode', val)" />
                        <label for="addOnly" class="flex flex-col gap-1 font-normal! cursor-pointer">
                            <div class="text-slate-700">{{ $t('contacts.import_dialog.add_only') }}</div>
                            <div>{{ $t('contacts.import_dialog.add_only_help') }}</div>
                        </label>
                    </div>
                    <div class="flex items-center gap-2">
                        <RadioButton inputId="addUpdate" name="mode" value="ADD_AND_REPLACE"
                            :modelValue="props.importMode" @update:modelValue="val => emit('update:importMode', val)" />
                        <label for="addUpdate" class="flex flex-col gap-1 font-normal! cursor-pointer">
                            <div class="text-slate-700">{{ $t('contacts.import_dialog.add_update') }}</div>
                            <div>{{ $t('contacts.import_dialog.add_update_help') }}</div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
