<script setup lang="ts">
import { IconCopy, IconPencil, IconX } from '@tabler/icons-vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { type Component } from 'vue'

const props = defineProps<{
  id: string
  icon: Component
  title: string
  hideEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'onCopy'): void
  (e: 'onEdit'): void
  (e: 'onDelete'): void
}>()

const { removeNodes, addNodes, getNode, screenToFlowCoordinate } = useVueFlow()

const onDelete = () => {
  removeNodes([props.id])
  emit('onDelete')
}

const onCopy = () => {
  const node = getNode.value(props.id)
  if (!node) return

  const newNodeId = crypto.randomUUID()
  const copiedNode = {
    id: newNodeId,
    type: node.type,
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50,
    },
    data: {
      ...JSON.parse(JSON.stringify(node.data)),
    },
  }

  addNodes([copiedNode])
  emit('onCopy')
}
</script>

<template>
  <div class="flex flex-col rounded-md border-2 border-emerald-500 max-w-[300px]">
    <div class="flex justify-between bg-slate-200 py-2 px-4 gap-10">
      <div class="flex items-center gap-2">
        <component :is="icon" class="text-emerald-500" size="18" />
        <span class="text-lg text-slate-800">{{ title }}</span>
      </div>

      <div class="flex items-center gap-2">
        <IconCopy
          class="cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
          size="14"
          @click.stop="onCopy"
        />
        <IconPencil
          v-if="!hideEdit"
          class="cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
          size="14"
          @click.stop="emit('onEdit')"
        />
        <IconX
          class="cursor-pointer text-red-600 hover:text-red-800 transition-colors"
          size="14"
          @click.stop="onDelete"
        />
      </div>
    </div>

    <slot></slot>

    <slot name="handles">
      <Handle id="target" type="target" :position="Position.Left" :connectable="true" />
      <Handle id="source" type="source" :position="Position.Right" :connectable="true" />
    </slot>
  </div>
</template>
