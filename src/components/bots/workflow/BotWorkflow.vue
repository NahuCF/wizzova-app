<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { computed, markRaw, ref, watch, onMounted, nextTick } from 'vue'
import { useFlowDragAndDrop } from '~/composables/workflow/useFlowDragAndDrop'
import type { BotEdge, BotNode, BotNodeType, BotViewport } from '~/types'
import StartingNode from '../nodes/StartingNode.vue'
import MessageNode from '../nodes/MessageNode.vue'
import MarkAsSolvedNode from '../nodes/MarkAsSolvedNode.vue'
import AssignChatNode from '../nodes/AssignChatNode.vue'
import ConditionNode from '../nodes/ConditionNode.vue'
import MediaNode from '../nodes/MediaNode.vue'
import QuestionButtonNode from '../nodes/QuestionButtonNode.vue'
import WorkingHoursNode from '../nodes/WorkingHoursNode.vue'
import { theme } from '~/app/theme'
import TemplateNode from '../nodes/TemplateNode.vue'
import LocationNode from '../nodes/LocationNode.vue'
import StartAgainNode from '../nodes/StartAgainNode.vue'
import SetVariableNode from '../nodes/SetVariableNode.vue'
import CustomEdge from './CustomEdge.vue'

const props = defineProps<{
  nodes: BotNode[]
  edges: BotEdge[]
  viewport?: BotViewport
}>()

const { onConnect, addEdges, toObject, getEdges, removeEdges, getNode, setViewport, fitView } =
  useVueFlow()
const { isDragOver, onDragStart, onDragOver, onDrop, onDragLeave, addNodeInCenter } =
  useFlowDragAndDrop()

const nodeTypes = ref<Record<BotNodeType, any>>({
  starting_node: markRaw(StartingNode),
  message: markRaw(MessageNode),
  template: markRaw(TemplateNode),
  image: markRaw(MediaNode),
  video: markRaw(MediaNode),
  audio: markRaw(MediaNode),
  document: markRaw(MediaNode),
  question_button: markRaw(QuestionButtonNode),
  condition: markRaw(ConditionNode),
  start_again: markRaw(StartAgainNode),
  mark_as_solved: markRaw(MarkAsSolvedNode),
  assign_chat: markRaw(AssignChatNode),
  location: markRaw(LocationNode),
  working_hours: markRaw(WorkingHoursNode),
  set_variable: markRaw(SetVariableNode),
})

const edgeTypes = ref<Record<string, any>>({
  default: markRaw(CustomEdge),
  smoothstep: markRaw(CustomEdge),
})

const loadedNodes = computed<BotNode[]>(() => {
  // Check if we have a start node with position from props
  const existingStartNode = props.nodes.find((n) => n.id === 'start')

  if (existingStartNode) {
    // Use the provided start node with its saved position
    // Filter out the start node from props.nodes to avoid duplicates
    const otherNodes = props.nodes.filter((n) => n.id !== 'start')
    return [existingStartNode, ...otherNodes]
  } else {
    // Create a default start node if none exists
    return [
      {
        id: 'start',
        position: {
          x: 300,
          y: 300,
        },
        type: 'starting_node',
        data: {},
      },
      ...props.nodes,
    ]
  }
})

const normalizeEdges = computed(() => {
  const getEdgeStyle = (edge: BotEdge) => {
    const { condition_path, option_id, working_hours_path } = edge.data || {}

    const conditions = {
      success: condition_path === 'true',
      failure: condition_path === 'false',
      option: !!option_id,
      available: working_hours_path === 'Available',
      unavailable: working_hours_path === 'Unavailable',
    }

    type ConditionKey = keyof typeof conditions

    const styleMap: Partial<Record<ConditionKey, { handle: string; color: string }>> = {
      success: { handle: 'success', color: theme.primitive.emerald['500'] },
      failure: { handle: 'failure', color: theme.primitive.red['500'] },
      option: { handle: option_id || 'source', color: theme.primitive.emerald['700'] },
      available: { handle: 'Available', color: theme.primitive.emerald['500'] },
      unavailable: { handle: 'Unavailable', color: theme.primitive.red['500'] },
    }

    const key = (Object.keys(conditions) as ConditionKey[]).find((k) => conditions[k])
    if (key && styleMap[key]) return styleMap[key]

    if (edge.source) return { handle: 'source', color: theme.primitive.slate['500'] }

    return { handle: undefined, color: theme.primitive.slate['500'] }
  }

  return props.edges.map((edge) => {
    const { handle, color } = getEdgeStyle(edge)
    return {
      ...edge,
      type: 'smoothstep',
      sourceHandle: handle,
      targetHandle: edge.target ? 'target' : undefined,
      style: { stroke: color, strokeWidth: 2 },
    }
  })
})

onConnect((params) => {
  const { source, target, sourceHandle, targetHandle } = params
  const sourceNode = getNode.value(source)
  const currentEdges = getEdges.value

  const isConditionNode = sourceNode?.type === 'condition'
  const isWorkingHoursNode = sourceNode?.type === 'working_hours'

  // For condition and working_hours nodes, prevent same target for different outputs
  if (isConditionNode || isWorkingHoursNode) {
    const otherEdgesFromSource = currentEdges.filter(
      (edge) => edge.source === source && edge.sourceHandle !== sourceHandle,
    )

    // Check if any of them already point to the same target
    const hasSameTarget = otherEdgesFromSource.some((edge) => edge.target === target)

    if (hasSameTarget) {
      console.warn('Condition/WorkingHours nodes cannot have the same target for different outputs')
      return
    }
  }

  // For question_button nodes: each option can only have ONE connection
  // For other nodes: each output can only have ONE connection
  // Remove any existing connection from the same source handle
  const existingEdgesFromHandle = currentEdges.filter(
    (edge) => edge.source === source && edge.sourceHandle === sourceHandle,
  )

  if (existingEdgesFromHandle.length > 0) {
    removeEdges(existingEdgesFromHandle.map((edge) => edge.id))
  }

  const conditions = {
    success: sourceHandle === 'success',
    failure: sourceHandle === 'failure',
    available: sourceHandle === 'Available',
    unavailable: sourceHandle === 'Unavailable',
    option:
      sourceHandle &&
      !['success', 'failure', 'Available', 'Unavailable', 'source'].includes(sourceHandle),
  }

  type ConditionKey = keyof typeof conditions

  const styleMap: Record<ConditionKey, { color: string; data: Record<string, any> }> = {
    success: { color: theme.primitive.emerald['500'], data: { condition_path: 'true' } },
    failure: { color: theme.primitive.red['500'], data: { condition_path: 'false' } },
    available: {
      color: theme.primitive.emerald['500'],
      data: { working_hours_path: 'Available' },
    },
    unavailable: {
      color: theme.primitive.red['500'],
      data: { working_hours_path: 'Unavailable' },
    },
    option: { color: theme.primitive.emerald['700'], data: { option_id: sourceHandle } },
  }

  const key = (Object.keys(conditions) as ConditionKey[]).find((k) => conditions[k])
  const { color, data } = key ? styleMap[key] : { color: theme.primitive.slate['500'], data: {} }

  addEdges([
    {
      ...params,
      type: 'smoothstep',
      data: data,
      style: { stroke: color, strokeWidth: 2 },
    },
  ])
})

watch(
  () => props.viewport,
  (newViewport) => {
    if (newViewport) {
      setViewport(newViewport)
    }
  },
  { deep: true },
)

defineExpose({
  save: toObject,
})
</script>

<template>
  <div class="w-full h-full flex" @drop="onDrop">
    <BotFlowSidebar @dragStart="onDragStart" @addNode="addNodeInCenter" />

    <VueFlow
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :nodes="loadedNodes"
      :edges="normalizeEdges"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <DropzoneBackground
        class="transition-colors 0.2s ease"
        :class="[isDragOver ? 'bg-emerald-100' : 'bg-transparent']"
      />
    </VueFlow>
  </div>
</template>
