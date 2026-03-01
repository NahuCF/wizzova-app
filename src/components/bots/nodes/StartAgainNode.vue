<script setup lang="ts">
import { IconReload } from '@tabler/icons-vue'
import { type NodeProps, Handle, Position } from '@vue-flow/core'
import type { BotNodeDataMap } from '~/types'

defineProps<
  NodeProps & {
    position: {
      x: number
      y: number
    }
    type: 'start_again'
    data: BotNodeDataMap['start_again']
  }
>()

defineEmits(['updateNodeInternals'])
</script>

<template>
  <BaseNode :id="id" :icon="IconReload" :title="$t(`bot_workflow.nodes.${type}`)" hideEdit>
    <template #handles>
      <Handle id="target" type="target" :position="Position.Left" :connectable="true" />
    </template>
  </BaseNode>
</template>
