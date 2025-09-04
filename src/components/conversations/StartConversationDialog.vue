<script setup lang="ts">
import { IconX, IconSearch, IconUserPlus, IconArrowLeft, IconAsterisk } from '@tabler/icons-vue'
import { nextTick, ref, watch } from 'vue'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { usePaginatedData } from '~/composables/usePaginatedData'
import { API } from '~/services'
import { useContactFieldStore, useSessionStore } from '~/stores'
import type { WABANumber, ContactItem, ContactItemField, ConversationItem } from '~/types'

const props = defineProps<{
    visible: boolean,
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'onStartConversation', value: ConversationItem): void
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
const { getContactName, getContactPhone } = useContactUtils()

const scrollContainer = ref<HTMLElement>()
const sentinel = ref<HTMLElement | null>(null)
const loadingNumbers = ref(false)
const broadcastNumbers = ref<WABANumber[]>([])
const selectedNumber = ref<WABANumber>()
const showNewContact = ref(false)
const name = ref('')
const phone = ref('')

const startConversation = async (contact: ContactItem) => {
    try {
        if(!sessionStore.user || !sessionStore.user.default_waba) return

        const { data: response } = await API.conversation.create({
            contact_id: contact.id,
            waba_id: sessionStore.user.default_waba.id,
            meta_id: getContactPhone(contact) ?? '',
            user_id: sessionStore.user.id,
            is_solved: false,
            expires_at: ''
        })

        emit('onStartConversation', response.data)
    } catch(error) {
        handleError(error)
    }
}

const createContactWithConversation = async () => {
    try {
        // await API.contact.createWithConversation({
        //     broadcast_number_id: selectedNumber.value.id
        // })

        emit('update:visible', false)
    } catch(error) {
        handleError(error)
    }
}

const fetchBroadcastNumbers = async () => {
    loadingNumbers.value = true
    try {
        const { data: response } = await API.broadcast.broadcastNumbers()
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

fetchBroadcastNumbers()
contactFieldStore.fetchContactFields()
fetchDataPage(1, rowsPerPage.value)

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
        await nextTick()
        initScroll()
    }
    else {
        showNewContact.value = false
        searchTerm.value = ''
        fetchDataPage(1, rowsPerPage.value)
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
        class="min-w-[25rem] max-w-[450px]"
    >
        <div v-if="!showNewContact" class="flex flex-col gap-6 pt-6">
            <div class="flex justify-between items-center gap-3">
                <div class="text-lg font-normal">{{ $t('Initiate new conversation') }}</div>

                <Select 
                    id="broadcastNumbers" 
                    v-model="selectedNumber" 
                    :options="broadcastNumbers" 
                    option-id="id"
                    option-label="name"
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

                <div class="text-emerald-600 font-semibold">{{ $t('Create contact') }}</div>
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
                    <div class="text-lg font-normal">{{ $t('Create Contact') }}</div>
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
                    v-model="name"
                    fluid
                    class="shadow-none!"
                    name="name"
                />
            </div>

            <div class="flex flex-col gap-2 relative">
                <label class="text-lg flex items-center gap-1" for="phone">
                    <span class="text-neutral-800">{{ $t(`contacts.headers.Phone`) }}</span>
                    <IconAsterisk color="red" size="8" />
                </label>

                <CellphoneInput v-model="phone" />
            </div>

            <div class="grid grid-cols-2 gap-2">
                <Select 
                    id="broadcastNumbers" 
                    v-model="selectedNumber" 
                    :options="broadcastNumbers" 
                    option-id="id"
                    option-label="name"
                    :placeholder="$t('broadcasts.select_number')"
                    :loading="loadingNumbers"
                    :disabled="loadingNumbers"
                    
                />

                <Button @click="createContactWithConversation()" >
                    {{ $t(`Start Conversation`) }}
                </Button>
            </div>
        </div>
    </Dialog>
</template>