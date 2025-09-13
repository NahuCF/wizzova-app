<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconInfoCircle, IconEdit, IconArrowLeft, IconLoader2 } from '@tabler/icons-vue'
import { useContactUtils } from '~/composables/useContactUtils'
import type { ContactFormExpose, ContactItem } from '~/types'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore, useUserStore } from '~/stores'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { storeToRefs } from 'pinia'

const props = defineProps<{
	contact?: ContactItem
}>()

const emit = defineEmits<{
	(e: 'onContactUpdated', value: ContactItem): void
}>()

const { t } = useI18n()
const handleError = useErrorHandler()
const contactFieldStore = useContactFieldStore()
const { contactFields } = storeToRefs(contactFieldStore)
const { fetchContactFields } = contactFieldStore
const userStore = useUserStore()
const { getContactName } = useContactUtils()

const isEditing = ref(false)
const contactForm = ref<ContactFormExpose | undefined>()
const loading = ref(false)

const name = computed(() => 
	props.contact ? getContactName(props.contact) : undefined
)

const fieldById = (id: string) => {
	return props.contact?.fields.find(f => f.field_value_id === id)
}

const formatValue = (value: string | boolean | string[]) => {
	if(typeof value === 'boolean') {
		return value ? t('yes') : t('no')
	}

	if(Array.isArray(value)) {
		return value.join(', ')
	}

	const user = userStore.users.find(u => u.id === value)
	if(user) {
		return user.name
	}

	return value
}

const onConfirm = async () => {
    const formValues = contactForm.value?.validate()
    if (!formValues || !props.contact) return

    const updatedContact = {
        id: props.contact.id,
        fields: formValues
    }

	loading.value = true
    try {
		const { data: response } = await API.contact.update(updatedContact)

		emit('onContactUpdated', response.data)
		isEditing.value = false
	} catch(error) {
		handleError(error)
	} finally {
		loading.value = false
	}
}

watch(() => props.contact, () => {
	isEditing.value = false
})

fetchContactFields()
userStore.fetchUsers()
</script>

<template>
	<div v-if="contact && name" class="flex flex-col gap-6 p-6">
		<div v-if="!isEditing" class="flex justify-between items-center">
			<div class="flex items-center gap-2 flex-1 overflow-hidden">
				<div>
					<Avatar
						:label="name.charAt(0).toLocaleUpperCase()"
						class="bg-emerald-200! text-slate-500!"
						size="large"
						shape="circle"
					/>
				</div>
				<div>{{ name }}</div>
				<div v-tooltip.bottom="{
					value: name,
					class: 'max-w-[250px]!'
				}">
					<IconInfoCircle class="text-gray-400 hover:cursor-pointer" size="16" />
				</div>
			</div>

			<div>
				<Button
					severity="secondary"
					class="min-w-[32px]! h-[32px]!"
					@click="isEditing = true"
				>
					<div>
						<IconEdit size="16" />
					</div>
				</Button>
			</div>
		</div>

		<div v-else class="flex justify-between items-center">
			<div class="flex items-center gap-1">
				<div>
					<Button variant="text" @click="isEditing = false" severity="secondary">
						<IconArrowLeft size="16" />
					</Button>
				</div>
				<span class="text-lg">
					{{ t('contacts.edit') }}
				</span>
			</div>

			<div class="flex gap-2">
				<Button
					severity="secondary"
					size="small"
					:disabled="loading"
					@click="contactForm?.reset()"
				>
					{{ $t('reset')}}
				</Button>

				<Button size="small" :disabled="loading" @click="onConfirm">
					<IconLoader2 v-if="loading" class="animate-spin w-5 h-5" />
					<span v-else>{{ $t('save')}}</span>
				</Button>
			</div>
		</div>

		<div v-if="!isEditing" class="flex flex-col gap-6">
			<div 
				v-for="field in contactFields.filter(f => f.name !== 'Name' && f.is_primary_field)"
				class="flex flex-col gap-1"
			>
				<label class="text-lg text-gray-400!">
					{{ 
						$te(`contacts.headers.${field.name}`) 
							? $t(`contacts.headers.${field.name}`) 
							: field.name 
					}}
				</label>

				<span>{{  formatValue(fieldById(field.id)?.value ?? '-') }}</span>
			</div>

			<div class="flex flex-col gap-2" v-if="contactFields.filter(f => !f.is_primary_field).length > 0">
				<label class="text-lg text-neutral-800! font-medium">
					{{ $t('contacts.additional_details') }}
				</label>
				<div class="flex flex-col gap-6">
					<div
						v-for="field in contactFields.filter(f => !f.is_primary_field)"
						:key="field.id"
						class="flex flex-col gap-1"
					>
						<label class="text-lg text-gray-400!">
							{{ 
								$te(`contacts.headers.${field.name}`) 
									? $t(`contacts.headers.${field.name}`) 
									: field.name 
							}}
						</label>

						<span>{{  formatValue(fieldById(field.id)?.value ?? '-') }}</span>
					</div>
				</div>
			</div>
		</div>

		<ContactForm 
			v-else
			ref="contactForm"
			:fields="contactFieldStore.contactFields"
			:contact="contact"
		/>
	</div>
</template>