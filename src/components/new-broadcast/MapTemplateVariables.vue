<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { IconLoader2 } from '@tabler/icons-vue'
import { useContactFieldStore } from '~/stores'
import type { VariableMapping } from '~/types'

const props = defineProps<{
	variables: VariableMapping[],
	loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'onCancel'): void,
	(e: 'onConfirm'): void
}>()

const contactFieldStore = useContactFieldStore()

const radioStates = ref<Record<string, 'contact_field' | 'custom_value'>>({})
const errors = ref<Record<string, boolean>>({})

const formatVariable = (name: string) => `{{${name}}}`

const getVariableMapping = (name: string) => {
	return props.variables?.find(v => v.name === name)!
}

const validate = () => {
    let hasError = false
    errors.value = {}

    for (const variable of props.variables || []) {
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

    emit('onConfirm')
}

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

onMounted(() => {
	for (const variable of props.variables) {
		const mapping = getVariableMapping(variable.name)
		radioStates.value[variable.name] = mapping?.contact_field_id ? 'contact_field' : 'custom_value'
	}
})
</script>

<template>
	<div class="flex flex-col gap-6 p-6">
		<div class="text-lg text-gray-400 font-medium">
			{{ $t('new_broadcast.map_variables_notes') }}
		</div>

		<table class="table-auto w-full bg-slate-50 rounded-lg border-separate border-spacing-y-3">
			<thead>
				<tr>
					<th class="text-start font-semibold min-w-[20%] p-5 text-lg">
						{{ $t('new_broadcast.variables') }}
					</th>
					<th class="text-start font-semibold p-5 text-lg">
						{{ $t('new_broadcast.map') }}
					</th>
					<th class="text-start font-semibold min-w-[30%] p-5 text-lg">
						{{ $t('new_broadcast.values') }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr 
					v-for="variable in variables" :key="variable.name"
				>
					<td class="p-5 text-sky-500">
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
							:invalid="Boolean(errors[variable.name])"
						/>
						<Message 
							v-if="errors[variable.name]" 
							severity="error" 
							:closable="false" 
							class="mt-2"
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
							:invalid="Boolean(errors[variable.name])"
						/>
						<Message 
							v-if="errors[variable.name]" 
							severity="error" 
							:closable="false" 
							class="mt-2"
						>
							{{ $t('new_broadcast.custom_field_error') }}
						</Message>
					</td>
				</tr>
			</tbody>
		</table>

		<div class="flex justify-end gap-2">
			<Button type="button" severity="secondary" variant="text" :disabled="loading" @click="emit('onCancel')">
				{{ $t('cancel') }}
			</Button>
			<Button type="button" severity="primary" :disabled="loading" @click="validate">
				<IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
				<span v-else>
					{{ $t('confirm') }}
				</span>
			</Button>
		</div>
	</div>
</template>