<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { IconArrowLeft } from '@tabler/icons-vue'
import { useBroadcastStore } from '~/stores'

const broadcastStore = useBroadcastStore()
const { currentStep, newBroadcast, showMapDialog } = storeToRefs(broadcastStore)

const toPrevStep = () => {
  newBroadcast.value.template = undefined
  newBroadcast.value.variables = undefined
  currentStep.value--
}

const toNextStep = () => {
  showMapDialog.value = false
  currentStep.value++
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between pt-2.5">
      <div class="flex items-center gap-2">
        <Button class="p-1!" variant="text" @click="toPrevStep" severity="secondary">
          <IconArrowLeft size="22" />
        </Button>
        <h1 class="font-semibold text-2xl">{{ $t('new_broadcast.select_audience') }}</h1>
      </div>
    </div>

    <ContactGroupsTab v-model:selectedGroups="newBroadcast.contactGroups" />

    <Dialog
      v-if="newBroadcast.template"
      v-model:visible="showMapDialog"
      modal
      :draggable="false"
      contentClass="p-0! h-full"
      class="min-w-[25rem] max-w-[1088px] w-full"
    >
      <template #header>
        <div class="text-2xl font-semibold">
          {{ $t('new_broadcast.map_variables') }}
        </div>
      </template>
      <MapTemplateVariables
        v-if="newBroadcast.variables"
        :variables="newBroadcast.variables"
        @onCancel="showMapDialog = false"
        @onConfirm="toNextStep"
      />
    </Dialog>
  </div>
</template>
