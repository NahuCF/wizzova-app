<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import {
	NodeEditor,
	type GetSchemes,
	ClassicPreset,
	type BaseSchemes
} from 'rete'
import { AreaPlugin, AreaExtensions } from 'rete-area-plugin'
import {
	ConnectionPlugin,
	Presets as ConnectionPresets
} from 'rete-connection-plugin'
import { VuePlugin, Presets, type VueArea2D } from 'rete-vue-plugin'
import { getDOMSocketPosition } from 'rete-render-utils'

import FlowNode from '~/components/flows/FlowNode.vue'
import CustomConnection from '~/components/flows/CustomConnection.vue'
import CustomSocket from '~/components/flows/CustomSocket.vue'
import "./background.css";
import type { TestNode } from '~/composables/useTestBotFlow'

const start = performance.now()

function addCustomBackground<S extends BaseSchemes, K>(
	area: AreaPlugin<S, K>
) {
	const background = document.createElement("div");

	background.classList.add("background");
	background.classList.add("fill-area");

	area.area.content.add(background);
}

type Schemes = GetSchemes<
	ClassicPreset.Node,
	ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>
>
type AreaExtra = VueArea2D<Schemes>

const props = defineProps<{
  originalNodes: TestNode[]
  reteNodes: ClassicPreset.Node[]
  reteEdges: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>[]
}>()

const container = ref<HTMLElement | null>(null)
let editor: NodeEditor<Schemes> | null = null
let area: AreaPlugin<Schemes, AreaExtra> | null = null

onMounted(async () => {
	if (!container.value) return

	new ClassicPreset.Socket('socket')

	editor = new NodeEditor<Schemes>()
	area = new AreaPlugin<Schemes, AreaExtra>(container.value)
	const connection = new ConnectionPlugin<Schemes, AreaExtra>()
	const render = new VuePlugin<Schemes, AreaExtra>()

	AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
		accumulating: AreaExtensions.accumulateOnCtrl()
	})

	render.addPreset(
		Presets.classic.setup({
			socketPositionWatcher: getDOMSocketPosition({
				offset({ x, y }, nodeId, side, key) {
					return {
						x: x + 8 * (side === 'input' ? -1 : 1),
						y
					}
				}
			}),
			customize: {
				node(context) {
					if (context.payload.label === 'Custom') {
						return FlowNode
					}
					return Presets.classic.Node
				},
				socket() {
					return CustomSocket
				},
				connection() {
					return CustomConnection
				}
			}
		})
	)

	connection.addPreset(ConnectionPresets.classic.setup())

	addCustomBackground(area)

	editor.use(area)
	area.use(connection)
	area.use(render)

	AreaExtensions.simpleNodesOrder(area)

	for (const reteNode of props.reteNodes) {
		await editor!.addNode(reteNode)

		const originalNode = props.originalNodes.find(n => n.id === reteNode.id)
		if (originalNode && area) {
			await area.translate(reteNode.id, {
				x: originalNode.position.x,
				y: originalNode.position.y,
			})
		}
	}

	for (const edge of props.reteEdges) {
		await editor.addConnection(edge)
	}

	AreaExtensions.zoomAt(area, editor.getNodes())

	const end = performance.now()
	console.log(`[Rete] Loaded ${props.reteNodes.length} nodes and ${props.reteEdges.length} edges in ${(end - start).toFixed(2)}ms`)
})

onBeforeUnmount(() => {
	area?.destroy()
})
</script>

<template>
	<div ref="container" class="w-full h-[600px] border rounded"></div>
</template>
