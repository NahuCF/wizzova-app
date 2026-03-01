<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useConversationChannels } from '~/composables/pusher/useConversationChannels'
import { useContactUtils } from '~/composables/useContactUtils'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useUserStore } from '~/stores/user'
import { useConversationsStore } from '~/stores/conversations'
import { useMessagesStore } from '~/stores/messages'
import type {
  ConversationItem,
  CreateMessage,
  ContactItem,
  ConversationActivity,
  ConversationExists,
} from '~/types'
import Chat from '~/components/common/Chat.vue'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'
import moment from 'moment'
import axios from 'axios'

const { t } = useI18n()
const toast = useToast()
const conversationStore = useConversationsStore()
const messagesStore = useMessagesStore()
const userStore = useUserStore()
const handleError = useErrorHandler()
const { getContactName, getContactPhone } = useContactUtils()

const {
  selectedConversation,
  changingSolved,
  changingOwner,
  currentTab,
  conversationsByTab,
  stats,
  loading: loadingConversations,
  totalUnreadCount,
} = storeToRefs(conversationStore)

const showStartConversationDialog = ref(false)
const showTemplateDialog = ref(false)
const sendingMessage = ref(false)
const activities = ref<ConversationActivity[]>([])
const searchingContact = ref(false)
const chatRef = ref<InstanceType<typeof Chat> | null>(null)
const showNavigateToConversation = ref(false)
const conversationExistsId = ref('')
const defaultPageTitle = ref(document.title)

const messages = computed(() => {
  if (!selectedConversation.value) return []
  return messagesStore.getMessagesForConversation(selectedConversation.value.id)
})

const disableReply = computed(
  () =>
    !selectedConversation.value ||
    selectedConversation.value.is_solved ||
    selectedConversation.value.is_expired ||
    !selectedConversation.value.is_initiated,
)

const selectedConversationIndex = computed(() => {
  return conversationsByTab.value[currentTab.value].findIndex(
    (c) => selectedConversation.value?.id === c.id,
  )
})

const startConversation = (conversation: ConversationItem) => {
  showStartConversationDialog.value = false

  conversationStore.insertConversationIntoTabs(conversation)

  conversationStore.selectConversation(conversation)
  messagesStore.loadInitialPage(conversation.id)
}

const navigateToConversation = async (conversationId: string) => {
  showNavigateToConversation.value = false

  const tabConvs = conversationsByTab.value[currentTab.value] || []
  const index = tabConvs.findIndex((c) => c.id === conversationId)
  if (index >= 0) {
    const first = tabConvs[0]
    tabConvs[0] = tabConvs[index]
    tabConvs[index] = first
    conversationStore.selectConversation(tabConvs[0])
    messagesStore.loadInitialPage(tabConvs[0].id)
    return
  }

  try {
    const { data: response } = await API.conversation.get(conversationId)
    tabConvs.unshift(response.data)
    conversationStore.selectConversation(tabConvs[0])
    messagesStore.loadInitialPage(tabConvs[0].id)
  } catch (error) {
    handleError(error)
  }
}

const updateContact = (contact: ContactItem) => {
  if (!selectedConversation.value) return

  conversationStore.insertConversationIntoTabs({ ...selectedConversation.value, contact })
}

const sendTextMessage = async ({
  message,
  type,
  mentions,
  replyId,
}: {
  message: string
  type: 'REPLY' | 'NOTES'
  mentions: Record<string, string>[]
  replyId?: string
}) => {
  if (!selectedConversation.value) return

  const newMessage: CreateMessage = {
    conversation_id: selectedConversation.value.id,
    type: type === 'REPLY' ? 'text' : 'note',
    to_phone: '',
    content: message,
    mentions: mentions.length ? mentions : undefined,
  }
  if (replyId) newMessage.reply_to_message_id = replyId
  await sendMessage(newMessage)
}

const sendMessage = async (newMessage: CreateMessage) => {
  if (!selectedConversation.value) return
  const contactPhone = getContactPhone(selectedConversation.value.contact)
  if (!contactPhone) return

  newMessage.to_phone = contactPhone
  sendingMessage.value = true
  const convId = selectedConversation.value.id
  try {
    const { data: response } = await API.message.create(newMessage)

    messagesStore.ensurePage(convId, 1) // insert at first page
    messagesStore.messagesPaginationByConversation[convId].pages[1].unshift(response.data)
    conversationStore.updateConversationWithMessage(response.data, true)

    if (response.data.template_id) {
      await messagesStore.ensureTemplatesForMessages([response.data])
    }

    if (!selectedConversation.value.is_initiated) {
      selectedConversation.value.is_initiated = true
      selectedConversation.value.expires_at = moment().add(1, 'day').toISOString()

      if (selectedConversationIndex.value >= 0) {
        conversationStore.insertConversationIntoTabs(selectedConversation.value)
      }
      fetchActivities()
    }
  } catch (error) {
    handleError(error)

    if (
      axios.isAxiosError(error) &&
      error.response?.data.message_code === 'conversation_is_expired'
    ) {
      const updatedConv = {
        ...selectedConversation.value,
        is_expired: true,
      }

      conversationStore.insertConversationIntoTabs(updatedConv)
    }
  } finally {
    sendingMessage.value = false
  }
}

const fetchActivities = async () => {
  if (!selectedConversation.value) return
  try {
    const { data: response } = await API.conversation.activities(selectedConversation.value.id)
    activities.value = response.data
  } catch (error) {
    handleError(error)
  }
}

const loadMoreMessages = async () => {
  if (!selectedConversation.value) return
  await messagesStore.loadOlderMessages(selectedConversation.value.id)
}

const handleScrollToMessage = ({ messageId }: { messageId: string }) => {
  chatRef.value?.scrollToMessage(messageId)
}

const onConversationExists = (conversationExists: ConversationExists) => {
  conversationExistsId.value = conversationExists.data.conversation_id
  const assignedUser = conversationExists.data.assigned_user_name

  if (conversationExists.message_code === 'exist_draft_conversation') {
    showStartConversationDialog.value = false
    showNavigateToConversation.value = true
  } else if (conversationExists.message_code === 'exist_active_conversation') {
    toast.add({
      severity: 'info',
      summary: t('conversations.exists'),
      detail: t('conversations.conversation_assigned_to', { user: assignedUser }),
      life: 3000,
    })
  } else {
    handleError(conversationExists)
  }
}

watch(selectedConversation, (conv) => {
  if (conv) {
    messagesStore.loadInitialPage(conv.id)
    fetchActivities()
  }
})

watch(
  totalUnreadCount,
  () => {
    if (totalUnreadCount.value > 0) {
      document.title = `${defaultPageTitle.value} (${totalUnreadCount.value})`
    } else {
      document.title = defaultPageTitle.value
    }
  },
  { immediate: true },
)

conversationStore.selectConversation(null)
userStore.fetchUsers()
conversationStore.refreshStats()
conversationStore.fetchConversations()
useConversationChannels()
</script>

<template>
  <div class="grid grid-cols-5 h-full">
    <ConversationsPanel
      @onStartConversation="showStartConversationDialog = true"
      @scrollToMessage="handleScrollToMessage"
    />

    <div
      v-if="!selectedConversation"
      class="col-span-4 flex flex-col justify-center items-center h-full gap-4"
    >
      <div class="text-[1.6rem] font-bold">{{ $t('conversations.select_conversation') }}</div>
      <div class="text-lg text-gray-400">
        {{ $t('conversations.select_conversation_description') }}
      </div>
      <Button class="text-lg font-semibold mt-4" @click="showStartConversationDialog = true">
        {{ $t('conversations.initiate_conversation') }}
      </Button>
    </div>

    <div v-else class="col-span-4 flex flex-col max-h-[100vh]">
      <ChatHeader
        :conversation="selectedConversation"
        :changingSolved="changingSolved"
        :changingOwner="changingOwner"
        :stats="stats"
        @onSolved="conversationStore.changeSolved(selectedConversation, $event)"
        @onChangeOwner="conversationStore.changeOwner(selectedConversation, $event)"
        @onSearch="searchingContact = true"
      />

      <div class="grid grid-cols-4 h-full overflow-hidden">
        <Chat
          ref="chatRef"
          class="col-span-3"
          :conversationId="selectedConversation.id"
          :contactName="getContactName(selectedConversation.contact) || ''"
          :messages="messages"
          :activities="activities"
          :assignedUser="selectedConversation.assigned_user"
          :loadingTop="
            messagesStore.messagesPaginationByConversation[selectedConversation.id]?.loading
          "
          :loadingBottom="sendingMessage"
          :disableReply="disableReply"
          :customEvent="
            !selectedConversation.is_initiated ? $t('new_broadcast.select_template') : undefined
          "
          :templates="messagesStore.templates"
          :users="userStore.users"
          :allMessagesLoaded="
            !messagesStore.messagesPaginationByConversation[selectedConversation.id]?.loading &&
            messagesStore.messagesPaginationByConversation[selectedConversation.id]?.meta
              .current_page ===
              messagesStore.messagesPaginationByConversation[selectedConversation.id]?.meta
                .last_page
          "
          :initiated="selectedConversation.is_initiated"
          :expiresAt="selectedConversation.expires_at"
          @onSendMessage="sendTextMessage"
          @onCustomEvent="showTemplateDialog = true"
          @scrollTopReached="loadMoreMessages"
        />

        <div class="bg-white border-l-2 border-slate-100 h-full overflow-hidden">
          <ContactPanel
            v-model:isSearching="searchingContact"
            :contact="selectedConversation.contact"
            :conversationId="selectedConversation.id"
            @onContactUpdated="updateContact"
            @scrollToMessage="handleScrollToMessage"
          />
        </div>
      </div>
    </div>

    <StartConversationDialog
      v-model:visible="showStartConversationDialog"
      @onStartConversation="startConversation"
      @onConversationExists="onConversationExists"
    />

    <SelectTemplateDialog
      v-if="showTemplateDialog && selectedConversation"
      v-model:visible="showTemplateDialog"
      :conversationId="selectedConversation.id"
      @onConfirm="
        (message: CreateMessage) => {
          showTemplateDialog = false
          sendMessage(message)
        }
      "
    />

    <WarningDialog
      v-model:visible="showNavigateToConversation"
      :title="$t('conversations.exists')"
      :message="$t('conversations.navigate_to_conversation')"
      :cancelMessage="$t('no')"
      :confirm-message="$t('yes')"
      :loading="loadingConversations"
      @onCancel="showStartConversationDialog = true"
      @onConfirm="navigateToConversation(conversationExistsId)"
    />
  </div>
</template>
