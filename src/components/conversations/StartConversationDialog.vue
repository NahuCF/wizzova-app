<script setup lang="ts">
import { IconX, IconSearch, IconUserPlus, IconArrowLeft, IconAsterisk, IconLoader2 } from '@tabler/icons-vue'
import parsePhoneNumberFromString from 'libphonenumber-js/min'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { z } from 'zod'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useContactFieldStore, useSessionStore } from '~/stores'
import type { WABANumber, ContactItem, ConversationItem, ConversationExists } from '~/types'

const props = defineProps<{
    visible: boolean,
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'onStartConversation', value: ConversationItem): void
    (e: 'onConversationExists', value: ConversationExists): void
}>()

const {
    dataPage,
    loading,
    searchTerm,
    rowsPerPage,
    fetchDataPage,
    loadNextPage,
    debouncedFetch,
} = usePaginatedData<ContactItem>(
    (page, perPage, search) => API.contact.index(page, perPage, search).then(res => res.data),
    15
)
const handleError = useErrorHandler()
const sessionStore = useSessionStore()
const contactFieldStore = useContactFieldStore()
const { nameField, phoneField } = storeToRefs(contactFieldStore)
const { getContactName, getContactPhone } = useContactUtils()

const scrollContainer = ref<HTMLElement>()
const sentinel = ref<HTMLElement | null>(null)

const loadingNumbers = ref(false)
const broadcastNumbers = ref<WABANumber[]>([])
const selectedNumber = ref<WABANumber>()

const showNewContact = ref(false)
const newContact = ref({
    name: '',
    phone: ''
})
const contactErrors = ref<{
    name: string[],
    phone: string[]
}>({
    name: [],
    phone: []
})
const formErrors = ref<Record<string, string | null>>({})
const loadingConversation = ref(false)

const contactSchema = computed(() => z.object({
    name: z.string().refine((value) => value.length > 0, {
        message: 'contact_fields.name.is_required',
    }),
    phone: z.string().refine(
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
}))

const startConversation = async (contact: ContactItem) => {
    loadingConversation.value = true
    try {
        const contactPhones = contact.fields.find(field => field.name === 'Phone')

        if(!sessionStore.user || !sessionStore.defaultWaba || !selectedNumber.value) return
        if(!Array.isArray(contactPhones?.value) || contactPhones?.value.length === 0) {
            throw new Error('Contact has no valid phone')
        }

        contactPhones?.value.length

        const { data: response } = await API.conversation.create({
            contact_id: contact.id,
            waba_id: sessionStore.defaultWaba.id,
            phone_number_id: selectedNumber.value.id,
            to_phone: contactPhones.value[0]
        })

        if('message_code' in response) {
            emit('onConversationExists', response)
        }
        else {
            emit('onStartConversation', response.data)
        }
    } catch(error) {
        handleError(error)
    } finally {
        loadingConversation.value = false
    }
}

const validateContact = () => {
    const result = contactSchema.value.safeParse(newContact.value)

    formErrors.value = {}
    if (!result.success) {
        contactErrors.value = {
            name: result.error.formErrors.fieldErrors.name || [],
            phone: result.error.formErrors.fieldErrors.phone || []
        }
        return false
    }
    return true
}

const createContactWithConversation = async () => {
    if(!nameField.value || !phoneField.value) {
        throw new Error('Internal contact fields missing')
    }
    
    if(!validateContact()) return

    const contact = {
        id: '',
        fields: [
            {
                id: nameField.value.id,
                name: nameField.value.internal_name,
                value: newContact.value.name
            },
            {
                id: phoneField.value.id,
                name: phoneField.value.internal_name,
                value: [ newContact.value.phone ]
            }
        ]
    }

    loadingConversation.value = true
    try {
        const { data: response } = await API.contact.create(contact)
        startConversation(response.data)
    } catch(error) {
        handleError(error)
        loadingConversation.value = false
    }
}

const fetchBroadcastNumbers = async () => {
    if(!sessionStore.defaultWaba) return

    loadingNumbers.value = true
    try {
        const { data: response } = await API.broadcast.broadcastNumbers(sessionStore.defaultWaba.id)
        broadcastNumbers.value = response.data

        if(!selectedNumber.value && broadcastNumbers.value.length > 0) {
            selectedNumber.value = broadcastNumbers.value[0]
        }
    } catch(error) {
        console.log(error)
    } finally {
        loadingNumbers.value = false
    }
}

const initScroll = () => {
    if (!sentinel.value || !scrollContainer.value) return

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && !loading.value) {
                loadNextPage()
            }
        },
        {
            root: scrollContainer.value,
            rootMargin: '50px',
            threshold: 1.0,
        }
    )

    observer.observe(sentinel.value)
}

watch(() => props.visible, async () => {
    if(props.visible) {
        fetchBroadcastNumbers()
        contactFieldStore.fetchContactFields()
        fetchDataPage(1, rowsPerPage.value)
        await nextTick()
        initScroll()
    }
    else {
        showNewContact.value = false
        searchTerm.value = ''
        newContact.value = {
            name: '',
            phone: ''
        }
    }
})
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)"
        modal
        :draggable="false"
        :showHeader="false"
        class="min-w-[25rem] max-w-[550px]"
    >
        <div v-if="!showNewContact" class="flex flex-col gap-6 pt-6">
            <div class="flex justify-between items-center gap-3">
                <div class="text-lg font-normal">{{ $t('conversations.initiate_conversation') }}</div>

                <Select 
                    id="broadcastNumbers" 
                    v-model="selectedNumber" 
                    :options="broadcastNumbers"
                    option-id="id"
                    :option-label="(item: WABANumber) => `${item.verified_name} (${item.display_phone_number})`"
                    :placeholder="$t('broadcasts.select_number')"
                    :loading="loadingNumbers"
                    :disabled="loadingNumbers"
                />

                <Button severity="secondary" variant="text" rounded @click="emit('update:visible', false)">
                    <IconX size="16" />
                </Button>
            </div>

            <div class="relative w-full">
                <IconSearch size="14" class="mr-2 absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <InputText
                    v-model="searchTerm"
                    class="pl-8! pr-8! shadow-none!"
                    name="search"
                    id="search"
                    fluid
                    :placeholder="$t('search')"
                    clear
                    @input="debouncedFetch()"
                />
            </div>

            <div class="flex items-center gap-3 cursor-pointer" @click="showNewContact = true">
                <Avatar 
                    size="large"
                    shape="circle"
                >
                    <IconUserPlus size="20" class="text-emerald-600" />
                </Avatar>

                <div class="text-emerald-600 font-semibold">{{ $t('contacts.create_contact') }}</div>
            </div>

            <div 
                ref="scrollContainer" 
                class="flex flex-col gap-3 max-h-[300px] overflow-y-auto"
            >
                <div 
                    v-for="contact in dataPage.data" 
                    :key="contact.id" 
                    class="flex gap-3 py-3 hover:bg-gray-100 rounded cursor-pointer"
                    @click="startConversation(contact)"
                >
                    <div class="flex items-center">
						<Avatar 
							:label="getContactName(contact)?.charAt(0).toLocaleUpperCase()"
							size="large"
							shape="circle"
						/>
					</div>

                    <div class="flex flex-col gap-1">
                        <div>{{ getContactName(contact) }}</div>
                        <div class="text-gray-400">{{ getContactPhone(contact) }}</div>
                    </div>
                </div>

                <div v-if="dataPage.data.length === 0 && !loading" class="text-center text-gray-500">
                    {{ $t('contacts.empty') }}
                </div>

                <div ref="sentinel"></div>

                <div v-if="loading" class="text-center text-gray-500">
                    {{ $t('loading') }}
                </div>
            </div>
        </div>

        <div v-else class="flex flex-col gap-12 pt-6">
            <div class="flex justify-between items-center gap-3">
                <div class="flex items-center gap-1">
                    <Button variant="text" @click="showNewContact = false" class="p-1!" severity="secondary">
                        <IconArrowLeft size="18" />
                    </Button>
                    <div class="text-lg font-normal">{{ $t('contacts.create_contact') }}</div>
                </div>

                <Button severity="secondary" variant="text" rounded @click="emit('update:visible', false)">
                    <IconX size="16" />
                </Button>
            </div>

            <div class="flex flex-col gap-2 relative">
                <label class="text-lg flex items-center gap-1" for="name">
                    <span class="text-neutral-800">{{ $t(`contacts.headers.Name`) }}</span>
                    <IconAsterisk color="red" size="8" />
                </label>

                <InputText 
                    v-model="newContact.name"
                    fluid
                    class="shadow-none!"
                    name="name"
                />

                <Message
                    v-if="contactErrors.name?.length > 0"
                    severity="error"
                    size="small"
                    variant="simple"
					class="absolute bottom-[-1.6rem]"
                >
                    {{ $t(contactErrors.name[0]) }}
                </Message>
            </div>

            <div class="flex flex-col gap-2 relative">
                <label class="text-lg flex items-center gap-1" for="phone">
                    <span class="text-neutral-800">{{ $t(`contacts.headers.Phone`) }}</span>
                    <IconAsterisk color="red" size="8" />
                </label>

                <CellphoneInput v-model="newContact.phone" />

                <Message
                    v-if="contactErrors.phone?.length > 0"
                    severity="error"
                    size="small"
                    variant="simple"
					class="absolute bottom-[-1.6rem]"
                >
                    {{ $t(contactErrors.phone[0]) }}
                </Message>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <Select 
                    id="broadcastNumbers" 
                    v-model="selectedNumber" 
                    :options="broadcastNumbers" 
                    option-id="id"
                    :option-label="(item: WABANumber) => `${item.verified_name} (${item.display_phone_number})`"
                    :placeholder="$t('broadcasts.select_number')"
                    :loading="loadingNumbers"
                    :disabled="loadingNumbers"
                />

                <Button :disabled="loadingConversation" @click="createContactWithConversation()" >
                    <IconLoader2 v-if="loadingConversation" class="animate-spin w-6 h-6" />
                    <span v-else>
                        {{ $t(`conversations.start_conversation`) }}
                    </span>
                </Button>
            </div>
        </div>
    </Dialog>
</template>