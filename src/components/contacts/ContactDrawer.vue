<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconLoader2, IconClipboard, IconClipboardCheck } from '@tabler/icons-vue'
import type { ContactFieldItem, ContactFormExpose, ContactItem, CreateContact } from '~/types'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  visible: boolean
  title: string
  fields: ContactFieldItem[]
  loading?: boolean
  contact?: ContactItem
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'onConfirm', contactData: CreateContact): void
}>()

const { t } = useI18n()
const toast = useToast()

const copiedId = ref(false)
const contactId = ref('')
const contactForm = ref<ContactFormExpose | undefined>()

const onConfirm = () => {
  const formValues = contactForm.value?.validate()
  if (!formValues) return

  const saveContact: CreateContact = {
    id: contactId.value,
    fields: formValues,
  }

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
    }
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <Drawer
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    class="w-[560px]!"
    :header="title"
    position="right"
  >
    <Divider class="mt-2!" />

    <div class="flex flex-col gap-6 pt-6">
      <div v-if="contactId" class="flex items-center gap-1">
        <span class="text-neutral-800 font-medium">{{ $t('contacts.contact_id') }}:</span>
        <span>{{ contactId }}</span>
        <Button
          class="p-1!"
          severity="secondary"
          variant="text"
          rounded
          :aria-label="$t('copy')"
          :title="$t('copy')"
          @click="copyToClipboard"
        >
          <IconClipboard v-if="!copiedId" size="16" />
          <IconClipboardCheck v-else size="16" />
        </Button>
      </div>

      <ContactForm ref="contactForm" :fields="fields" :contact="contact" />
    </div>

    <template #footer>
      <div class="flex justify-end gap-4">
        <Button
          class="bg-white! border-slate-200! hover:bg-slate-100!"
          severity="secondary"
          @click="emit('update:visible', false)"
        >
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
