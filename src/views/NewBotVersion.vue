<script setup lang="ts">
import { IconArrowLeft, IconPencil, IconLoader2, IconAsterisk } from '@tabler/icons-vue'
import { ref, computed } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import type BotWorkflow from '~/components/bots/workflow/BotWorkflow.vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import { useBotStore, useContactFieldStore, useSessionStore, useUserStore } from '~/stores'
import { useTemplateStore } from '~/stores/template'
import type { BotActiveSessions, BotEdge, BotNode, BotNodeType, BotViewport } from '~/types'

const validNodeTypes: BotNodeType[] = [
  'starting_node',
  'message',
  'template',
  'image',
  'video',
  'audio',
  'document',
  'question_button',
  'condition',
  'start_again',
  'mark_as_solved',
  'assign_chat',
  'location',
  'working_hours',
  'set_variable',
]

const terminalNodeTypes: BotNodeType[] = ['mark_as_solved', 'assign_chat', 'start_again']

const route = useRoute()
const router = useRouter()
const handleError = useErrorHandler()
const contactFieldStore = useContactFieldStore()
const botStore = useBotStore()
const userStore = useUserStore()
const sessionStore = useSessionStore()
const templateStore = useTemplateStore()

const workflow = ref<InstanceType<typeof BotWorkflow> | null>(null)
const botId = ref<string>()
const versionId = ref<string>()
const name = ref('')
const editName = ref(false)
const saving = ref(false)
const nodes = ref<BotNode[]>([])
const edges = ref<BotEdge[]>([])
const viewport = ref<BotViewport | undefined>()
const initialState = ref<{
  name: string
  nodeIds: string[]
  edgeIds: string[]
}>({
  name: '',
  nodeIds: [],
  edgeIds: [],
})
const success = ref(false)
const pendingNext = ref<Function | null>(null)
const showLeaveDialog = ref(false)
const showActiveSessionsDialog = ref(false)
const activeSessions = ref<BotActiveSessions>()
const isDev = ref(import.meta.env.VITE_APP_ENV !== 'production')

const hasChanges = () => {
  const flowData = workflow.value?.save()

  if (!flowData) return false

  const currentNodeIds = flowData.nodes.filter((n) => n.id !== 'start').map((n) => n.id)
  const currentEdgeIds = flowData.edges.filter((e) => e.id !== 'start_edge').map((e) => e.id)

  const structureChanged =
    currentNodeIds.length !== initialState.value.nodeIds.length ||
    currentEdgeIds.length !== initialState.value.edgeIds.length ||
    !currentNodeIds.every((id) => initialState.value.nodeIds.includes(id)) ||
    !currentEdgeIds.every((id) => initialState.value.edgeIds.includes(id))

  const nameChanged = name.value !== initialState.value.name

  return structureChanged || nameChanged
}

const getUnconnectedNodes = computed(() => {
  const flowData = workflow.value?.save()
  if (!flowData) return []

  const unconnectedNodes: string[] = []

  flowData.nodes.forEach((node) => {
    if (node.id === 'start') return

    const hasIncoming = flowData.edges.some((edge) => edge.target === node.id)

    if (!hasIncoming) {
      unconnectedNodes.push(node.id)
    }
  })

  return unconnectedNodes
})

const hasNameError = computed(() => name.value.trim().length === 0)

const hasConnectionErrors = computed(() => getUnconnectedNodes.value.length > 0)

const hasNoNodes = computed(() => {
  const flowData = workflow.value?.save()
  if (!flowData) return false

  return flowData.nodes.filter((n) => n.id !== 'start').length === 0
})

const canSave = computed(
  () => !hasNameError.value && !hasConnectionErrors.value && !hasNoNodes.value,
)

const saveButtonTooltip = computed(() => {
  if (hasNameError.value) {
    return 'bot_workflow.name_required'
  }
  if (hasNoNodes.value) {
    return 'bot_workflow.no_nodes'
  }
  if (hasConnectionErrors.value) {
    return 'bot_workflow.unconnected_nodes'
  }
  return ''
})

const isBotNodeType = (type: string | undefined): type is BotNodeType => {
  return typeof type === 'string' && validNodeTypes.includes(type as BotNodeType)
}

const loadBot = async () => {
  const id = route.params.id
  const versionParamId = route.params.versionId

  if (typeof id === 'string') {
    botId.value = id
  }

  if (typeof versionParamId === 'string') {
    versionId.value = versionParamId
  }

  if (botId.value && versionId.value) {
    try {
      const { data: versionData } = await API.botVersion.getData(botId.value, versionId.value)

      name.value = versionData.name
      viewport.value = versionData.viewport

      // Filter out the starting_node and handle it separately
      const startingNode = versionData.nodes.find((n) => n.type === 'starting_node')
      const otherNodes = versionData.nodes.filter((n) => n.type !== 'starting_node')

      // Create the start node for the workflow with saved position or default
      const startNodeForWorkflow = {
        id: 'start',
        position: startingNode ? startingNode.position : { x: 300, y: 300 },
        type: 'starting_node' as const,
        data: {},
      }

      // Set nodes with start node first
      nodes.value = [startNodeForWorkflow, ...otherNodes]

      edges.value = versionData.edges.map((edge) => {
        let sourceHandle = undefined

        if (edge.data) {
          // For condition nodes - backend uses condition_path
          if (edge.data.condition_path === 'true') {
            sourceHandle = 'success'
          } else if (edge.data.condition_path === 'false') {
            sourceHandle = 'failure'
          }
          // For working_hours nodes
          else if (edge.data.working_hours_path === 'Available') {
            sourceHandle = 'Available'
          } else if (edge.data.working_hours_path === 'Unavailable') {
            sourceHandle = 'Unavailable'
          }
          // For question_button nodes
          else if (edge.data.option_id) {
            sourceHandle = edge.data.option_id
          }
        }

        if (edge.source === 'starting_node') {
          return {
            ...edge,
            id: edge.id || 'start_edge',
            source: 'start',
            sourceHandle,
          }
        }

        return {
          ...edge,
          sourceHandle,
        }
      })

      initialState.value = {
        name: name.value,
        nodeIds: otherNodes.map((n) => n.id),
        edgeIds: versionData.edges.map((e) => e.id),
      }

      // If no starting node was found, try to find the first node and connect it
      if (!startingNode) {
        const firstNode = otherNodes.find(
          (node) => !versionData.edges.find((edge) => edge.target === node.id),
        )
        if (firstNode) {
          edges.value = [
            {
              id: 'start_edge',
              source: 'start',
              target: firstNode.id,
            },
            ...edges.value,
          ]
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
}

const goToVersions = () => {
  if (!botId.value) return

  router.push({
    name: 'bot-details',
    params: { id: botId.value },
    query: {
      tab: 'versions',
    },
  })
}

const onSave = async () => {
  const flowData = workflow.value?.save()
  if (!flowData || !botId.value) return

  saving.value = true
  try {
    // Include all nodes except 'start' which will be saved as 'starting_node'
    const nodes: BotNode[] = flowData.nodes
      .filter((n) => n.id !== 'start' && isBotNodeType(n.type))
      .map((n): BotNode => {
        return {
          id: n.id,
          position: n.position,
          type: n.type as BotNodeType,
          data: n.data,
        }
      })

    // Add the start node as a starting_node type with a proper UUID
    const startNode = flowData.nodes.find((n) => n.id === 'start')
    if (startNode) {
      nodes.unshift({
        id: crypto.randomUUID(),
        position: startNode.position,
        type: 'starting_node',
        data: {},
      })
    }

    // Transform edges - replace 'start' source with the first node that was connected to it
    const edges: BotEdge[] = flowData.edges
      .map((edge) => {
        // Prepare edge data based on sourceHandle
        let edgeData = edge.data || {}

        // Convert sourceHandle to condition_path for condition nodes
        const sourceNode = flowData.nodes.find((n) => n.id === edge.source)
        if (sourceNode?.type === 'condition') {
          if (edge.sourceHandle === 'success') {
            edgeData = { ...edgeData, condition_path: 'true' }
          } else if (edge.sourceHandle === 'failure') {
            edgeData = { ...edgeData, condition_path: 'false' }
          }
        }
        // For working_hours nodes, preserve the path
        else if (sourceNode?.type === 'working_hours') {
          if (edge.sourceHandle === 'Available' || edge.sourceHandle === 'Unavailable') {
            edgeData = { ...edgeData, working_hours_path: edge.sourceHandle }
          }
        }
        // For question_button nodes, store the option_id
        else if (
          sourceNode?.type === 'question_button' &&
          edge.sourceHandle &&
          edge.sourceHandle !== 'source'
        ) {
          edgeData = { ...edgeData, option_id: edge.sourceHandle }
        }

        if (edge.source === 'start') {
          // Find the starting_node we just created
          const startingNode = nodes.find((n) => n.type === 'starting_node')
          if (startingNode) {
            return {
              ...edge,
              id: edge.id === 'start_edge' ? crypto.randomUUID() : edge.id,
              source: startingNode.id,
              data: edgeData,
            } as BotEdge
          }
        }

        return {
          ...edge,
          data: edgeData,
        } as BotEdge
      })
      .filter((edge) => edge.source && edge.target) as BotEdge[]

    const viewport: BotViewport = flowData.viewport

    const payload = {
      id: versionId.value || '',
      name: name.value,
      nodes,
      edges,
      viewport,
    }

    if (versionId.value) {
      const { data: response } = await API.botVersion.update(botId.value, payload)
    } else {
      const { data: response } = await API.botVersion.create(botId.value, payload)
    }

    success.value = true
    goToVersions()
  } catch (error) {
    handleError(error)
  } finally {
    saving.value = false
  }
}

const onCheckActiveSessions = async () => {
  if (!botId.value) return

  try {
    const { data: response } = await API.bot.activeSessions(botId.value)
    activeSessions.value = response

    if (activeSessions.value.total_active_sessions > 0) {
      showActiveSessionsDialog.value = true
    } else {
      onSave()
    }
  } catch (error) {
    handleError(error)
  }
}

const confirmLeave = () => {
  showLeaveDialog.value = false
  if (pendingNext.value) pendingNext.value()
}

const cancelLeave = () => {
  showLeaveDialog.value = false
  if (pendingNext.value) pendingNext.value(false)
}

onBeforeRouteLeave((_to, _from, next) => {
  if (success.value === true || !hasChanges()) {
    next()
  }

  showLeaveDialog.value = true
  pendingNext.value = next
})

loadBot()
if (contactFieldStore.contactFields.length === 0) {
  contactFieldStore.fetchContactFields()
}
if (botStore.variables.length === 0) {
  botStore.fetchVariables()
}
if (userStore.users.length === 0) {
  userStore.fetchUsers()
}
if (!templateStore.loaded) {
  templateStore.fetchTemplates()
}
</script>

<template>
  <div class="flex flex-col h-[100vh]">
    <div class="flex justify-between p-4 bg-white shadow z-1">
      <div class="flex items-center gap-1">
        <Button variant="text" @click="goToVersions()" class="p-1!" severity="secondary">
          <IconArrowLeft size="22" />
        </Button>
        <div v-if="editName">
          <InputText
            v-model="name"
            :placeholder="$t('bot_workflow.no_name')"
            fluid
            id="name"
            name="name"
            @focusout="editName = false"
          />
        </div>
        <div v-else class="flex gap-1 text-lg text-slate-500 pl-2">
          {{ name || $t('bot_workflow.no_name') }}
          <IconAsterisk v-if="name.trim().length === 0" color="red" size="8" />
        </div>
        <Button variant="text" @click="editName = !editName" class="p-1!" severity="secondary">
          <IconPencil size="18" />
        </Button>
      </div>

      <div class="flex items-center gap-3">
        <div v-if="isDev" class="flex items-center gap-3">
          <ToggleSwitch v-model="sessionStore.hasPremiumAccess" />
          <div class="text-lg">Enable premium nodes</div>
        </div>

        <div
          v-tooltip.bottom="
            !canSave && {
              value: $t(saveButtonTooltip),
              class: 'custom-tooltip text-sm',
            }
          "
        >
          <Button @click="onCheckActiveSessions" :disabled="saving || !canSave">
            <IconLoader2 v-if="saving" class="animate-spin w-6 h-6" />
            <span v-else>
              {{ $t(`save`) }}
            </span>
          </Button>
        </div>
      </div>
    </div>
    <BotWorkflow ref="workflow" :nodes="nodes" :edges="edges" :viewport="viewport" />

    <Dialog
      v-model:visible="showLeaveDialog"
      modal
      :header="$t('unsaved_changes')"
      :closable="false"
    >
      <p>{{ $t('unsaved_changes_message') }}</p>
      <template #footer>
        <Button :label="$t('cancel')" @click="cancelLeave" severity="secondary" />
        <Button :label="$t('leave')" @click="confirmLeave" severity="danger" />
      </template>
    </Dialog>

    <WarningDialog
      v-model:visible="showActiveSessionsDialog"
      :loading="saving"
      :title="$t('bot_workflow.active_sessions')"
      :message="
        $t('bot_workflow.active_sessions_message', {
          count: activeSessions?.total_active_sessions || 0,
        })
      "
      :confirmMessage="$t('confirm')"
      @onConfirm="onSave"
    />
  </div>
</template>
