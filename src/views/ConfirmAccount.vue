<template>
  <div class="w-full flex items-center justify-center">
    <div class="border rounded-lg bg-white p-16 shadow-sm w-[38rem]">
      <div class="text-center">
        <div class="flex justify-center">
          <div class="relative">
            <IconMailOpened class="w-12 h-12 text-blue-400" />
            <Badge class="absolute top-0 right-[-.6rem] !pt-[.1rem]" value="1" severity="danger" />
          </div>
        </div>

        <h1 class="font-bold text-2xl mb-2">{{ $t('check_your_email') }}</h1>

        <div class="flex gap-1 justify-center">
          <span>{{ $t('we_have_sent_email_to') }}</span>
          <strong>{{ session.tenant.email }}</strong>
        </div>
        <div>{{ $t('remember_check_your_spam') }}</div>

        <p class="my-5">{{ $t('didnt_receive_email') }}</p>

        <Button @click="resend" :loading="loading">
          <span v-if="!loading">{{ $t('resend_email') }}</span>
          <IconLoader2 v-else class="animate-spin w-6 h-6" />
        </Button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { Button, Badge, useToast } from 'primevue'
import { IconMailOpened, IconLoader2 } from '@tabler/icons-vue'
import { useSessionStore } from '~/stores/session'
import AuthService from '~/services/AuthService'
import { useI18n } from 'vue-i18n'
import { onMounted, ref } from 'vue'

const session = useSessionStore()
const toast = useToast()
const { t } = useI18n()
const loading = ref(false)

const resend = async () => {
  loading.value = true
  try {
    await AuthService.sendVerifyAccount({
      email: session.tenant.email,
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: t('verification_email_sent'),
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: t('an_error_occurred'),
      life: 3000,
    })
  }
  loading.value = false
}

onMounted(() => {
  resend()
})
</script>
