<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useBroadcastStore } from '~/stores'
import { useContactFieldStore } from '~/stores'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const contactFieldStore = useContactFieldStore()
const broadcastStore = useBroadcastStore()
const { getVariableMapping } = broadcastStore
const { currentStep, newBroadcast, showMapDialog } = storeToRefs(broadcastStore)

const radioStates = ref<Record<string, 'contact_field' | 'custom_value'>>({})
const errors = ref<Record<string, boolean>>({})

const toPrevStep = () => {
    newBroadcast.value.template = undefined
    newBroadcast.value.variables = undefined
    currentStep.value--
}

const formatVariable = (name: string) => `{{${name}}}`

const toNextStep = () => {
    let hasError = false
    errors.value = {}

    for (const variable of newBroadcast.value.variables || []) {
        const mapping = getVariableMapping(variable.name)
        const selected = radioStates.value[variable.name]

        const contactFieldError = selected === 'contact_field' && !mapping.contact_field_id
        const customValueError = selected === 'custom_value' && !mapping.value?.trim()

        if(contactFieldError || customValueError) {
            errors.value[variable.name] = true
            hasError = true
        }
    }

    if (hasError) return

    showMapDialog.value = false
    currentStep.value++
}

watch([() => showMapDialog.value], (open) => {
    if (open && newBroadcast.value.variables) {
        for (const variable of newBroadcast.value.variables) {
            const mapping = getVariableMapping(variable.name)
            radioStates.value[variable.name] = mapping?.contact_field_id ? 'contact_field' : 'custom_value'
        }
    }
}, { immediate: true })

watch(radioStates, (states) => {
    for (const [name, type] of Object.entries(states)) {
        const mapping = getVariableMapping(name)
        if (type === 'contact_field') {
            mapping.value = ''
        } else {
            mapping.contact_field_id = ''
        }
    }
}, { deep: true })

contactFieldStore.fetchContactFields()
</script>

<template>
    <div class="flex flex-col gap-6">
        <div class="flex justify-between pt-2.5">
            <div class="flex items-center gap-2">
                <Button variant="text" @click="toPrevStep" size="small" severity="secondary">
                    <IconArrowLeft size="18" />
                </Button>
                <h1 class="font-semibold text-lg">{{ $t('new_broadcast.select_audience') }}</h1>
            </div>
        </div>

        <ContactGroupsTab v-model:selectedGroups="newBroadcast.contactGroups" />

        <Dialog v-if="newBroadcast.template" v-model:visible="showMapDialog" modal :draggable="false"
            contentClass="p-0! h-full" class="min-w-[25rem] max-w-[1088px] w-full"
            :header="$t('new_broadcast.map_variables')">
            <div class="flex flex-col gap-6 p-6">
                <table class="table-auto w-full bg-slate-50 rounded-lg border-separate border-spacing-y-3">
                    <thead>
                        <tr>
                            <th class="text-start font-semibold min-w-[20%] p-5">
                                {{ $t('new_broadcast.variables') }}
                            </th>
                            <th class="text-start font-semibold p-5">
                                {{ $t('new_broadcast.map') }}
                            </th>
                            <th class="text-start font-semibold min-w-[30%] p-5">
                                {{ $t('new_broadcast.values') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="variable in newBroadcast.variables" :key="variable.name"
                        >
                            <td class="p-5 text-sm text-sky-500">
                                {{ formatVariable(variable.name) }}
                            </td>

                            <td class="p-5">
                                <div  class="flex gap-4">
                                    <div class="flex items-center gap-2">
                                        <RadioButton 
                                            v-model="radioStates[variable.name]" 
                                            :inputId="`contact_field_${variable.name}`"
                                            :name="`radio_${variable.name}`" 
                                            value="contact_field" 
                                            size="small" 
                                        />
                                        <label :for="`contact_field_${variable.name}`">
                                            {{ $t('new_broadcast.contact_field') }}
                                        </label>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <RadioButton 
                                            v-model="radioStates[variable.name]" 
                                            :inputId="`custom_value_${variable.name}`"
                                            :name="`radio_${variable.name}`"
                                            value="custom_value" 
                                            size="small" 
                                        />
                                        <label :for="`custom_value_${variable.name}`">
                                            {{ $t('new_broadcast.custom_value') }}
                                        </label>
                                    </div>
                                </div>
                            </td>

                            <!-- Contact field select -->
                            <td v-if="radioStates[variable.name] === 'contact_field'" class="p-5">
                                <Select 
                                    v-model="getVariableMapping(variable.name).contact_field_id" 
                                    :options="contactFieldStore.contactFields"
                                    optionLabel="name"
                                    optionValue="id"
                                    :placeholder="$t('new_broadcast.select_contact_field')"
                                    class="w-full" 
                                    size="small"
                                    :invalid="Boolean(errors[variable.name])"
                                />
                                <Message 
                                    v-if="errors[variable.name]" 
                                    severity="error" 
                                    :closable="false" 
                                    class="mt-2"
                                    size="small"
                                >
                                    {{ $t('new_broadcast.contact_field_error') }}
                                </Message>
                            </td>

                            <!-- Custom value input -->
                            <td v-else class="p-5">
                                <InputText 
                                    v-model="getVariableMapping(variable.name).value" 
                                    class="w-full"
                                    :placeholder="$t('new_broadcast.enter_custom_value')"
                                    size="small"
                                    :invalid="Boolean(errors[variable.name])"
                                />
                                <Message 
                                    v-if="errors[variable.name]" 
                                    severity="error" 
                                    :closable="false" 
                                    class="mt-2"
                                    size="small"
                                >
                                    {{ $t('new_broadcast.custom_field_error') }}
                                </Message>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="flex justify-end gap-2">
                    <Button type="button" severity="secondary" variant="text" @click="showMapDialog = false">{{ $t('cancel') }}</Button>
                    <Button type="button" severity="primary" @click="toNextStep">{{ $t('confirm') }}</Button>
                </div>
            </div>
        </Dialog>
    </div>
</template>