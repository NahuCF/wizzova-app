<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import moment from 'moment'
import { IconLoader2, IconClipboard, IconClipboardCheck } from '@tabler/icons-vue'
import FieldRenderer from './FieldRenderer.vue'
import type { ContactFieldItem, ContactItem, CreateContact } from '~/types'
import { API } from '~/services'
import { z } from 'zod'
import parsePhoneNumberFromString from 'libphonenumber-js/min'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '~/stores'

const props = defineProps<{
    visible: boolean
    title: string,
    fields: ContactFieldItem[],
    loading?: boolean
    contact?: ContactItem
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'onConfirm', contactData: CreateContact): void
}>()

const { t } = useI18n()
const toast = useToast()
const userStore = useUserStore()

const copiedId = ref(false)
const contactId = ref('')
const formValues = ref<Record<string, string | string[] | number | boolean | Date | null>>({})
const formErrors = ref<Record<string, string | null>>({})

const dynamicSchema = computed(() => {
    const shape: Record<string, z.ZodTypeAny> = {}

    props.fields.forEach(field => {
        let base = getBaseSchema(field)

        if (field.is_mandatory) {
            base = base.refine(val => {
                if (val === null || val === undefined) return false
                if (Array.isArray(val)) return val.some(v => v.trim?.())
                if (typeof val === 'string') return val.trim().length > 0
                return true
            }, { message: 'required' })
        } else {
            base = base.optional()
        }

        shape[field.name] = base
    })

    return z.object(shape)
})

const getBaseSchema = (field: ContactFieldItem) => {
    if (field.type === 'MULTI_TEXT' && field.internal_name?.toLowerCase() === 'phone') {
        return z.array(
            z.string().refine(
                (value) => {
                    try {
                        const phoneNumber = parsePhoneNumberFromString(value)
                        return phoneNumber?.isValid() ?? false
                    } catch {
                        return false
                    }
                },
                { message: 'invalid_cellphone' }
            )
        )
    }

    const typeMap: Record<string, z.ZodTypeAny> = {
        TEXT: z.string().nullable(),
        MULTI_TEXT: z.array(z.string()),
        SELECT: z.string().nullable(),
        DATE: z.date().nullable(),
    }

    return typeMap[field.type] ?? z.any()
}

const fieldInit = (f: ContactFieldItem) => {
    const existing = props.contact?.fields.find(field => field.name === f.name)
    if (existing) {
        if (f.type === 'DATE' && typeof existing.value === 'string') {
            const m = moment(existing.value, 'YYYY-MM-DD', true)
            return m.isValid() ? m.toDate() : null
        }
        else if (f.internal_name.toLowerCase() === 'phone' && typeof existing.value === 'string') {
            return existing.value.replace('+', '')
        }

        return existing.value
    }

    switch (f.type) {
        case 'TEXT': return ''
        case 'MULTI_TEXT': return f.name === 'Tags' ? [] : ['']
        case 'SELECT': return ''
        default: return null
    }
}

const validateForm = () => {
    const result = dynamicSchema.value.safeParse(formValues.value)

    formErrors.value = {}
    if (!result.success) {
        for (const issue of result.error.issues) {
            formErrors.value[issue.path[0] as string] = issue.message
        }
        return false
    }
    return true
}

const onConfirm = () => {
    if (!validateForm()) return

    const saveContact = {
        id: contactId.value,
        fields: props.fields
            .map(f => {
                let value = formValues.value[f.name]

                if (value instanceof Date) {
                    value = moment(value).format('YYYY-MM-DD')
                } else if (Array.isArray(value)) {
                    value = value.filter(v => v.trim?.())
                }

                return {
                    id: f.id,
                    name: f.name,
                    value
                }
            }).filter(f => {
                if (Array.isArray(f.value)) return f.value.length > 0

                return f.value !== null && f.value !== ''
            })
    } as CreateContact

    emit('onConfirm', saveContact)
}

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(contactId.value)

        if (!copiedId.value) {
            copiedId.value = true

            toast.add({
                severity: 'success',
                summary: t('copied_to_clipboard'),
                life: 3000,
            })

            setTimeout(() => {
                copiedId.value = false
            }, 3000)
        }
    } catch (error) {
        console.log(error)
    }
}

watch(
    [() => props.visible, () => props.fields],
    ([visible, fields]) => {
        if (visible && fields.length) {
            contactId.value = props.contact?.id || ''
            const values: Record<string, string | string[] | number | boolean | Date | null> = {}

            fields.forEach(f => {
                values[f.name] = fieldInit(f)
            })

            formValues.value = values
            formErrors.value = {}
        }
    },
    { immediate: true, deep: true }
)

watch(
    () => userStore.users.length,
    (len) => {
        if (len === 0) {
            userStore.fetchUsers()
        }
    },
    { immediate: true }
)
</script>

<template>
    <Drawer :visible="visible" @update:visible="emit('update:visible', $event)" class="w-[560px]!" :header="title"
        position="right">
        <Divider class="mt-2!" />

        <div class="flex flex-col gap-6 pt-6">
            <div v-if="contactId" class="flex items-center text-sm gap-1">
                <span class="text-neutral-800 font-medium">{{ $t('contacts.contact_id') }}:</span>
                <span>{{ contactId }}</span>
                <Button class="p-1!" severity="secondary" variant="text" size="small" rounded :aria-label="$t('copy')"
                    :title="$t('copy')" @click="copyToClipboard">
                    <IconClipboard v-if="!copiedId" size="16" />
                    <IconClipboardCheck v-else size="16" />
                </Button>
            </div>

            <template v-for="field in fields.filter(f => f.is_primary_field)" :key="field.id">
                <FieldRenderer :field="{ id: field.id, name: field.name, options: field.options }" :type="field.type"
                    :is-mandatory="field.is_mandatory" :user-options="userStore.users"
                    :error-message="formErrors[field.name] ?? undefined" v-model:value="formValues[field.name]" />
            </template>

            <div class="flex flex-col gap-2" v-if="fields.filter(f => !f.is_primary_field).length > 0">
                <label class="text-sm text-neutral-800! font-medium">
                    {{ $t('contacts.additional_details') }}
                </label>
                <div class="flex flex-col gap-6">
                    <template v-for="field in fields.filter(f => !f.is_primary_field)" :key="field.id">
                        <FieldRenderer :field="{ id: field.id, name: field.name, options: field.options }"
                            :type="field.type" :is-mandatory="field.is_mandatory" :user-options="userStore.users"
                            :error-message="formErrors[field.name] ?? undefined"
                            v-model:value="formValues[field.name]" />
                    </template>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-4">
                <Button class="bg-white! border-slate-200! hover:bg-slate-100!" severity="secondary"
                    @click="emit('update:visible', false)">
                    {{ $t('cancel') }}
                </Button>
                <Button @click="onConfirm()">
                    <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                    <span v-else>{{ $t('submit') }}</span>
                </Button>
            </div>
        </template>
    </Drawer>
</template>

<style lang="css" scoped>
:deep(.p-drawer-content) {
    padding-bottom: 0 !important;
}
</style>