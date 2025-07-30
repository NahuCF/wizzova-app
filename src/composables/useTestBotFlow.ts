import { ref, computed } from 'vue'
import dagre from 'dagre'

export interface TestNode {
	id: string
	label: string
	position: { x: number; y: number }
}

export interface TestEdge {
	id: string
	source: string
	target: string
}

export function useTestBotFlow() {
	const questionsInput = ref(10)
	const messagesInput = ref(10)

	function generateLargeTestFlow(questions = 10, messagesPerQuestion = 10) {
		const nodes: TestNode[] = []
		const edges: TestEdge[] = []

		let nodeId = 1

		nodes.push({ id: `${nodeId}`, label: 'Start', position: { x: 100, y: 100 } })
		const startId = `${nodeId}`
		nodeId++

		for (let i = 0; i < questions; i++) {
			const branchId = `${nodeId}`
			nodes.push({
				id: branchId,
				label: `Question ${i + 1}`,
				position: { x: 0, y: 0 },
			})
			edges.push({ id: `e-${startId}-${branchId}`, source: startId, target: branchId })
			nodeId++

			for (let j = 0; j < messagesPerQuestion; j++) {
				const leafId = `${nodeId}`
				nodes.push({
					id: leafId,
					label: `Message ${i + 1}.${j + 1}`,
					position: { x: 0, y: 0 },
				})
				edges.push({ id: `e-${branchId}-${leafId}`, source: branchId, target: leafId })
				nodeId++
			}
		}

		return { nodes, edges }
	}

	function layoutTree(nodes: TestNode[], edges: TestEdge[]) {
		const g = new dagre.graphlib.Graph()
		g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 100 })
		g.setDefaultEdgeLabel(() => ({}))

		nodes.forEach((node) => {
			g.setNode(node.id, { width: 150, height: 50 })
		})

		edges.forEach((edge) => {
			g.setEdge(edge.source, edge.target)
		})

		dagre.layout(g)

		return nodes.map((node) => {
			const { x, y } = g.node(node.id)
			return { ...node, position: { x: x - 75, y: y - 25 } }
		})
	}

	const currentFlow = computed(() => generateLargeTestFlow(questionsInput.value, messagesInput.value))
	const currentFlowWithLayout = computed(() => {
		const { nodes, edges } = currentFlow.value
		return { nodes: layoutTree(nodes, edges), edges }
	})

	const testCases = ref([
		{ questions: 3, messages: 3 },
		{ questions: 5, messages: 5 },
		{ questions: 10, messages: 10 },
		{ questions: 15, messages: 8 },
		{ questions: 20, messages: 5 },
		{ questions: 25, messages: 10 },
		{ questions: 30, messages: 15 },
		{ questions: 40, messages: 20 },
		{ questions: 50, messages: 25 }
	])

	const currentTestIndex = ref(-1)
	function runTest(index: number) {
		if (index >= 0 && index < testCases.value.length) {
			const test = testCases.value[index]
			questionsInput.value = test.questions
			messagesInput.value = test.messages
			currentTestIndex.value = index
		}
	}

	return {
		questionsInput,
		messagesInput,
		generateLargeTestFlow,
		testCases,
		currentTestIndex,
		currentFlow,
		currentFlowWithLayout,
		runTest,
	}
}
