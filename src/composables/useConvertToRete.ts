import { ClassicPreset } from 'rete'
import type { TestNode, TestEdge } from './useTestBotFlow'

const socket = new ClassicPreset.Socket('socket')

export function useConvertToRete(
	nodes: TestNode[],
	edges: TestEdge[]
): {
	reteNodes: ClassicPreset.Node[],
	reteEdges: ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>[]
} {
	const nodeMap = new Map<string, ClassicPreset.Node>()

	const reteNodes = nodes.map((n) => {
		const node = new ClassicPreset.Node('Custom')
		node.id = n.id
		node.addOutput('out', new ClassicPreset.Output(socket))
		node.addInput('in', new ClassicPreset.Input(socket))
		nodeMap.set(n.id, node)
		return node
	})

	const reteEdges = edges.map((e) => {
		const source = nodeMap.get(e.source)
		const target = nodeMap.get(e.target)

		if (!source || !target) {
			throw new Error(`Invalid edge: ${e.id} - source or target not found`)
		}

		return new ClassicPreset.Connection(source, 'out', target, 'in')
	})

	return { reteNodes, reteEdges }
}
