<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'
import {
  BezierEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useVueFlow,
  type EdgeProps,
} from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps<EdgeProps>()

const { removeEdges } = useVueFlow()

const path = computed(() =>
  getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  }),
)

const edgePath = computed(() => path.value[0])
const labelX = computed(() => path.value[1])
const labelY = computed(() => path.value[2])

const onDelete = (evt: MouseEvent) => {
  evt.stopPropagation()
  removeEdges([props.id])
}
</script>

<template>
  <!-- Use BezierEdge for the visual edge -->
  <BezierEdge v-bind="props" />

  <!-- Always visible delete button in the center -->
  <EdgeLabelRenderer>
    <div
      :style="{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
        pointerEvents: 'all',
      }"
      class="nodrag nopan"
    >
      <button @click="onDelete" class="delete-edge-button" title="Delete connection">
        <IconX size="10" />
      </button>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.delete-edge-button {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d1d5db;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.15s ease;
  opacity: 0.5;
}

.delete-edge-button:hover {
  opacity: 1;
  background: #ef4444;
  border-color: #ef4444;
  color: white;
  transform: scale(1.2);
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}
</style>
