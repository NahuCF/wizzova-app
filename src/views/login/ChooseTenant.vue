<script setup lang="ts">
import { storeToRefs } from 'pinia'
import router from '~/router'
import { useSessionStore } from '~/stores/session'
import type { Tenant } from '~/types'

const sessionStore = useSessionStore()
const { tenants, selectedTenant } = storeToRefs(sessionStore)

const chooseTenant = (tenant: Tenant) => {
  selectedTenant.value = tenant
  router.push('/login')
}

if (tenants.value.length === 0) {
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col w-full h-screen relative">
    <div class="flex absolute right-0 md:block p-3">
      <LanguageSelector class="ml-auto" />
    </div>
    <div class="w-full flex items-center justify-center flex-1">
      <div class="rounded-md bg-white p-16 shadow-md w-full md:w-[38rem] h-screen md:h-auto">
        <h1 class="text-4xl text-center font-bold mb-18 text-neutral-800">
          {{ $t('choose_tenant.title') }}
        </h1>
        <div class="flex flex-col gap-6">
          <Button v-for="tenant in tenants" :key="tenant.id" @click="chooseTenant(tenant)">
            <span>{{ tenant.company_name }}</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
