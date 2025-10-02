<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { IconInfoCircle, IconEdit, IconArrowLeft, IconLoader2, IconX, IconSearch } from '@tabler/icons-vue'
import moment from 'moment'
import { useContactUtils } from '~/composables/useContactUtils'
import type { ContactFormExpose, ContactItem, MessageItem } from '~/types'
import { useI18n } from 'vue-i18n'
import { useContactFieldStore, useUserStore } from '~/stores'
import { API } from '~/services'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { storeToRefs } from 'pinia'
import { usePaginatedData } from '~/composables/usePaginatedData'

const props = defineProps<{
	contact?: ContactItem,
	isSearching?: boolean,
	conversationId?: string
}>()

const emit = defineEmits<{
	(e: 'onContactUpdated', value: ContactItem): void
	(e: 'update:isSearching', value: boolean): void
}>()

const {
    dataPage: messages,
	searchTerm,
	loading: loadingMessages,
	debouncedFetch
} = usePaginatedData<MessageItem>(
    async (page, rows_per_page) => {
		if(!props.conversationId || !props.isSearching) return new Promise(resolve => resolve([]))

		const { data: response } = await API.message.index({
			page,
			rows_per_page,
			conversation_id: props.conversationId,
			...(searchTerm.value && { search: searchTerm.value })
		})
		
		return response
	},
    15
)

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

const highlightSearchTerm = (text?: string) => {
	if (!searchTerm.value || !text) return text

	const escapedTerm = searchTerm.value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
	const regex = new RegExp(`(${escapedTerm})`, 'gi')
	return text.replace(regex, `<span class="bg-yellow-200 font-semibold">$1</span>`)
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
	emit('update:isSearching', false)
	searchTerm.value = ''
	messages.value.data = []
})

watch(() => props.isSearching, () => {
	if(props.isSearching) {
		isEditing.value = false
		messages.value.data = []
	}
	else {
		searchTerm.value = ''
	}
})

watch(searchTerm, () => debouncedFetch())

fetchContactFields()
userStore.fetchUsers()
</script>

<template>
	<div v-if="contact && name" class="flex flex-col gap-6 h-full overflow-hidden">
		<div v-if="!isEditing && !isSearching" class="flex justify-between items-center p-6">
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

		<div v-if="!isEditing && !isSearching" class="flex flex-col gap-6 p-6">
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

		<div v-if="isSearching" class="flex flex-col gap-4 overflow-hidden">
			<div class="flex justify-between items-center pb-2 pt-6 px-6">
				<div class="flex items-center gap-1">
					<div>
						<Button variant="text" @click="emit('update:isSearching', false)" severity="secondary">
							<IconArrowLeft size="16" />
						</Button>
					</div>
					<span class="text-lg">
						{{ t('conversations.search_messages') }}
					</span>
				</div>

				<div>
					<Button variant="text" @click="emit('update:isSearching', false)" severity="secondary">
						<IconX size="16" />
					</Button>
				</div>
			</div>

			<div class="px-12">
				<div class="relative w-full">
					<IconSearch 
						size="14" 
						class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
					/>
					<InputText
						:modelValue="searchTerm"
						@update:modelValue="searchTerm = $event || ''"
						class="pl-8! pr-8! shadow-none!"
						name="search"
						id="search"
						fluid
						:placeholder="$t('search')"
						clear
					/>
					<IconX 
						v-if="searchTerm.length > 0"
						class="mr-2 absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 cursor-pointer"
						size="14"
						@click.stop="searchTerm = ''"
					/>
				</div>
			</div>

			<div class="flex flex-col overflow-y-auto">
				<div
					v-for="message in messages.data"
					:key="message.id"
					class="flex flex-col gap-3 p-3 hover:bg-slate-100 cursor-pointer"
				>
					<div class="text-sm text-gray-400">{{ moment(message.created_at).format('h:mm A') }}</div>
					<div class="text-slate-700" v-html="highlightSearchTerm(message.content)"></div>
				</div>

				<div v-if="!loadingMessages && messages.data.length === 0" class="flex justify-center p-8">
					<div class="text-center text-gray-400">{{ $t('conversations.no_messages_found') }}</div>
				</div>
			</div>
		</div>
		
		<div v-if="loadingMessages" class="flex justify-center p-8">
			<IconLoader2 class="animate-spin text-emerald-500" size="24" />
		</div>

		<div  v-if="isEditing" class="flex flex-col gap-6 p-6">
			<div class="flex justify-between items-center">
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

			<ContactForm 
				ref="contactForm"
				:fields="contactFieldStore.contactFields"
				:contact="contact"
			/>
		</div>
	</div>
</template>