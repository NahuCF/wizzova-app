<template>
  <div class="grid w-full justify-center items-center h-screen">
    <div class="flex flex-col gap-3 border rounded-lg bg-white p-8 shadow-sm w-[30rem]">
      <div class="flex">
        <div class="relative">
          <IconMailOpened class="w-12 h-12 text-blue-500" />
          <Badge class="absolute top-0 right-[-.6rem] !pt-[.1rem]" value="1" severity="danger" />
        </div>
      </div>

      <h1 class="text-2xl font-semibold">{{ $t('verify_your_email') }}</h1>

      <div>
        <p class="text-slate-600">{{ $t('sent_code_6_digits_to') }}:</p>
        <strong>{{ session.tenant.email }}</strong>
      </div>

      <div class="flex flex-col mt-4 gap-2">
        <div>{{ $t('insert_6_digit_code') }}</div>
        <InputOtp v-model="otpCode" size="large" :length="otpLength" />
      </div>

      <div>
        <div class="flex gap-1">
          <p class="text-slate-600">
            {{ $t('didnt_receive_code') }}
          </p>
          <div class="flex gap-1">
            <span
              @click="resend"
              :class="[
                'text-blue-500 hover:text-blue-600 hover:cursor-pointer',
                { 'hover:cursor-not-allowed text-slate-400 hover:text-slate-400': showCountdown },
              ]"
              >{{ $t('resend') }}</span
            >
            <span v-if="showCountdown">{{ countdown }}</span>
          </div>
        </div>
      </div>

      <Button @click="verify" class="mt-3" :disabled="loading || otpCode.length < otpLength">
        <span v-if="!loading">{{ $t('verify') }}</span>
        <IconLoader2 v-else class="animate-spin w-6 h-6" />
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Button, Badge, InputOtp, useToast } from 'primevue'
import { IconMailOpened } from '@tabler/icons-vue'
import { ref, watch } from 'vue'
import { useSessionStore } from '~/stores/session'
import AuthService from '~/services/AuthService'
import { useI18n } from 'vue-i18n'

const session = useSessionStore()
const toast = useToast()
const { t } = useI18n()
const otpCode = ref('')
const otpLength = ref(6)
const countdown = ref(60)
const interval = ref(null)
const showCountdown = ref(false)
const loading = ref(false)

watch(otpCode, (code) => {
  if (code.length === otpLength.value) {
    verify()
  }
})

const verify = async () => {
  loading.value = true
  try {
    await AuthService.verifyOtp({
      email: session.tenant.email,
      code: otpCode.value,
    })
  } catch (error) {
    otpCode.value = ''
    if (error.isValidationError) {
      let errors = error.validationErrors?.code
      if (errors) {
        let errorMessage = errors[0]
        toast.add({
          severity: 'error',
          summary: t('error'),
          detail: t(errorMessage.toLowerCase().split(' ').join('_')),
          life: 3000,
        })
      }
      return
    }
  } finally {
    loading.value = false
  }
}

const resend = async () => {
  try {
    await AuthService.resendOtp(session.tenant.email)
    startCountdown()
  } catch (error) {}
}

const startCountdown = () => {
  showCountdown.value = true
  interval.value = setInterval(() => {
    countdown.value -= 1
    if (countdown.value === 0) {
      clearInterval(interval.value)
      showCountdown.value = false
      countdown.value = 60
    }
  }, 1000)
}
</script>
