<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconAsterisk, IconLoader2, IconX } from '@tabler/icons-vue'
import type { ContactFieldCreate, ContactFieldItem, ContactFieldType } from '~/types'
import { z } from 'zod'
import { zodResolver } from '@primevue/forms/resolvers/zod'
import type { FormSubmitEvent } from '@primevue/forms'

const props = defineProps<{
    visible: boolean,
    loading: boolean,
    types: ContactFieldType[],
    contactField?: ContactFieldItem
}>()
const emit = defineEmits<{
    (e: 'onSave', payload: ContactFieldCreate): void
    (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()

const contactField = ref<ContactFieldCreate>({
    id: '',
    name: '',
    internal_name: '',
    is_mandatory: false,
    type: 'TEXT'
})
const options = ref<string[]>([t('contact_fields.option_prefilled')])
const internalNameEdited = ref(false)
const formRef = ref()

const resolver = zodResolver(
    z.object({
        name: z.string()
            .refine((value) => value.length > 0, {
                message: 'contact_fields.name.is_required',
            }),
        internal_name: z.string()
            .refine((value) => value.length > 0, {
                message: 'contact_fields.internal_name.is_required',
            })
    })
)

const save = ({ valid }: FormSubmitEvent) => {
    if(!valid) return

    if(contactField.value.type === 'SELECT') {
        // The only option is empty set default text
        if(options.value.length === 1 && options.value[0].trim() === '') {
            options.value[0] = t('contact_fields.option_prefilled')
        }
        contactField.value.options = options.value
    }

    emit('onSave', contactField.value)
}

const popOption = () => {
    if(options.value.length > 1) {
        options.value.pop()
    }
}

const onNameUpdate = (event: Event) => {
    const target = event.target as HTMLInputElement | null

    if (target && !internalNameEdited.value) {
        const formattedInternalName = target.value.replace(/[ ]/g, '_')
        contactField.value.internal_name = formattedInternalName
        formRef.value?.setFieldValue('internal_name', formattedInternalName)
    }
}

const onInternalNameUpdate = (event: Event) => {
    internalNameEdited.value = true
    const target = event.target as HTMLInputElement | null

    if (target) {
        const formattedInternalName = target.value.replace(/[ ]/g, '_')
        contactField.value.internal_name = formattedInternalName
        formRef.value?.setFieldValue('internal_name', formattedInternalName)
    }
}

const onNameKeypress = (event: KeyboardEvent) => {
    if (!/^[a-zA-Z ]$/.test(event.key)) {
        event.preventDefault()
    }
}

const onInternalNameKeypress = (event: KeyboardEvent) => {
    if (!/^[a-zA-Z_ ]$/.test(event.key)) {
        event.preventDefault()
    }
}

watch(() => props.visible, () => {
    if (props.visible && props.contactField) {
        contactField.value = {
            ...props.contactField
        }

        if(props.contactField.options) {
            options.value = [
                ...props.contactField.options
            ]
        }
        internalNameEdited.value = true
    } else if (props.visible && !props.contactField) {
        contactField.value = {
            id: '',
            name: '',
            internal_name: '',
            is_mandatory: false,
            type: 'TEXT'
        }
        options.value = [t('contact_fields.option_prefilled')]
        internalNameEdited.value = false
    }
})
</script>

<template>
    <Drawer :visible="visible" @update:visible="emit('update:visible', $event)" class="w-[32rem]!" header="Add Contact Field" position="right">
        <Form
            ref="formRef"
            v-slot="$form"
            class="flex flex-col gap-5"
            :initialValues="contactField"
            :validateOnValueUpdate="false"
            :resolver
            @submit="save"
        >
            <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label for="name">{{ $t('contact_field.name') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="contactField.name" 
                    :placeholder="$t('contact_fields.name.placeholder')" 
                    fluid
                    id="name"
                    name="name"
                    @keypress="onNameKeypress"
                    @input="onNameUpdate"
                />
                <p class="text-slate-500 text-sm">{{ t('contact_fields.name.help') }}</p>
                <Message
                    v-if="$form.name?.invalid"
                    severity="error"
                    variant="simple"
                >
                    {{ $t($form.name.error?.message) }}
                </Message>
            </div>

            <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label for="internal_name">{{ $t('contact_field.internal_name') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="contactField.internal_name" 
                    :placeholder="$t('contact_fields.internal_name.placeholder')" 
                    fluid
                    id="internal_name"
                    name="internal_name"
                    @keypress="onInternalNameKeypress"
                    @input="onInternalNameUpdate"
                />
                <p class="text-slate-500 text-sm">{{ t('contact_fields.internal_name.help') }}</p>
                <Message
                    v-if="$form.internal_name?.invalid"
                    severity="error"
                    variant="simple"
                >
                    {{ $t($form.internal_name.error?.message) }}
                </Message>
            </div>

            <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label for="type">{{ $t('contact_field.type') }}</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <Select
                    v-model="contactField.type"
                    :options="types"
                />
            </div>

            <div v-if="contactField.type === 'SELECT'">
                <div class="flex flex-col gap-1 relative">
                    <div class="flex gap-1">
                        <label for="options">{{ $t('contact_field.options') }}</label>
                    </div>
                    <div v-for="(option, index) in options" :key="`field_option_${index}`" class="flex gap-5 items-center">
                        <InputText 
                            v-model="options[index]"
                            fluid
                        />
                        <IconX 
                            @click="popOption"
                            :class="{ 
                                'cursor-not-allowed': options.length === 1, 
                                'opacity-50': options.length === 1,
                                'cursor-pointer': options.length > 1
                            }" 
                        />
                    </div>
                    <div class="flex justify-end">
                        <Button class="py-0! hover:underline" variant="link" size="large" @click="options.push('')">
                            {{ $t('contact_fields.add_options') }}
                        </Button>
                    </div>
                </div>
            </div>

            <div class="pt-4 w-full">
                <Button class="w-full" type="submit" :disabled="loading">
                    <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                    <span v-else>
                        {{ $t('save').toUpperCase() }}
                    </span>
                </Button>
            </div>
        </Form>
    </Drawer>
</template>