<script setup lang="ts">
import { IconMapPin, IconMap, IconAsterisk } from '@tabler/icons-vue'
import { type NodeProps, useVueFlow } from '@vue-flow/core'
import { computed, onMounted, ref, toRaw, watch } from 'vue'
import { useBotStore } from '~/stores'

interface LocationNodeData {
  name: string
  latitude: number | null
  longitude: number | null
  address: string
}

const props = defineProps<
  NodeProps & {
    type: 'location'
    position: { x: number; y: number }
    data: LocationNodeData
  }
>()

defineEmits(['updateNodeInternals'])

const { updateNodeData } = useVueFlow()

const botStore = useBotStore()

const drawerVisible = ref(false)

onMounted(() => {
  if (props.data.__isNew) {
    drawerVisible.value = true
  }
})
const mapVisible = ref(false)
const variablesPopover = ref()
const showVariableDialog = ref(false)

const newData = ref<LocationNodeData>({
  name: '',
  latitude: null,
  longitude: null,
  address: '',
})

const openVariablesPopover = (event: MouseEvent) => {
  variablesPopover.value.toggle(event)
}

const addVariable = (variableName: string) => {
  newData.value.name += `{{${variableName}}}`
}

const canSave = computed(
  () => newData.value.name && newData.value.latitude && newData.value.longitude,
)

const onSave = () => {
  updateNodeData(props.id, {
    ...props.data,
    name: newData.value.name,
    latitude: newData.value.latitude,
    longitude: newData.value.longitude,
    address: newData.value.address,
  })
  drawerVisible.value = false
}

const onLocationCoordinatesUpdate = (val: { lat: number; lng: number }) => {
  newData.value.latitude = val.lat
  newData.value.longitude = val.lng
}

const onLocationSelected = (val: { address: string }) => {
  newData.value.address = val.address
}

watch(drawerVisible, (visible) => {
  if (visible) newData.value = structuredClone(toRaw(props.data))
})
</script>

<template>
  <BaseNode
    :id="id"
    :icon="IconMapPin"
    :title="$t(`bot_workflow.nodes.${type}`)"
    @onEdit="drawerVisible = true"
  >
    <div class="flex flex-col gap-2 p-6 bg-white rounded-md">
      <LocationNodeMap
        v-if="data.latitude && data.longitude"
        :location="
          data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null
        "
      />

      <div v-if="data.name" class="flex items-center gap-2 text-gray-700">
        <IconMap size="18" />
        <span class="font-medium truncate">{{ data.name }}</span>
      </div>

      <div v-if="data.address" class="text-sm text-slate-500">
        {{ data.address }}
      </div>
    </div>
  </BaseNode>

  <BaseNodeDrawer
    :icon="IconMapPin"
    :title="$t(`bot_workflow.nodes.${type}`)"
    v-model:visible="drawerVisible"
    :disableSave="!canSave"
    @onSave="onSave"
  >
    <div class="p-6 flex flex-col gap-6 bg-white">
      <div class="flex flex-col gap-2 text-lg">
        <div class="flex gap-1">
          <label class="font-medium">{{ $t('bot_workflow.location.name') }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <InputText
          v-model="newData.name"
          :placeholder="$t('bot_workflow.location.enter_name')"
          class="w-full"
        />
        <Button
          severity="info"
          variant="outlined"
          class="self-start !border !border-slate-300 font-bold text-base!"
          size="small"
          @click="openVariablesPopover($event)"
        >
          {{ $t('new_template.body.add_variable') }}
        </Button>
      </div>

      <div class="flex flex-col gap-2 text-lg">
        <div class="flex gap-1">
          <label class="font-medium">{{ $t('bot_workflow.location.select_location') }}</label>
          <IconAsterisk color="red" class="mt-1" size="8" />
        </div>
        <div>
          <Button severity="info" variant="outlined" @click="mapVisible = true">
            <div class="flex gap-2">
              <IconMapPin class="text-sky-600" size="16" />
              <span class="font-bold">{{ $t('bot_workflow.location.choose_location') }}</span>
            </div>
          </Button>
        </div>
      </div>

      <div v-if="newData.latitude && newData.longitude" class="text-sm text-gray-600 mt-2">
        <p class="text-lg">
          <strong>{{ $t('bot_workflow.location.address') }}:</strong>
          {{ newData.address }}
        </p>
      </div>
    </div>
  </BaseNodeDrawer>

  <Dialog
    v-model:visible="mapVisible"
    class="w-[50vw]"
    :header="$t('bot_workflow.location.select_location')"
    modal
  >
    <div class="w-full h-full flex flex-col items-end gap-6">
      <LocationPicker
        :modelValue="
          newData.latitude && newData.longitude
            ? { lat: newData.latitude, lng: newData.longitude }
            : null
        "
        @update:modelValue="onLocationCoordinatesUpdate"
        @locationSelected="onLocationSelected"
      />

      <div>
        <Button @click="mapVisible = false">
          <span>{{ $t('confirm') }}</span>
        </Button>
      </div>
    </div>
  </Dialog>

  <BotVariableSelect
    ref="variablesPopover"
    @onCreate="showVariableDialog = true"
    @onSelect="addVariable"
  />

  <BotVariableDialog
    v-model:visible="showVariableDialog"
    @onCreated="botStore.variables.push($event)"
  />
</template>

<style scoped>
.leaflet-container {
  height: 100%;
  width: 100%;
}
</style>
