import { 
	IconCheck, IconClock, IconFile, IconLocation, 
	IconMathLower, IconMessage, IconPhoto, IconQuestionMark, 
	IconTemplate, IconUser, IconVideo, IconVolume
} from '@tabler/icons-vue'
import { useVueFlow } from '@vue-flow/core'
import { ref, watch, type Component } from 'vue'

export type BotNodeCategory = 'send_message' | 'question' | 'general'
export type BotNodeType = {
	name: string,
	icon: Component,
	isPremium: boolean,
	category: BotNodeCategory
}

export const nodeTypes: BotNodeType[] = [
	{
		name: 'send_message',
		icon: IconMessage,
		isPremium: false,
		category: 'send_message'
	},
	{
		name: 'send_template',
		icon: IconTemplate,
		isPremium: true,
		category: 'send_message'
	},
	{
		name: 'send_image',
		icon: IconPhoto,
		isPremium: false,
		category: 'send_message'
	},
	{
		name: 'send_video',
		icon: IconVideo,
		isPremium: true,
		category: 'send_message'
	},
	{
		name: 'send_audio',
		icon: IconVolume,
		isPremium: true,
		category: 'send_message'
	},
	{
		name: 'send_document',
		icon: IconFile,
		isPremium: false,
		category: 'send_message'
	},
	{
		name: 'question_button',
		icon: IconQuestionMark,
		isPremium: false,
		category: 'question'
	},
	{
		name: 'condition',
		icon: IconMathLower,
		isPremium: false,
		category: 'general'
	},
	{
		name: 'mark_as_solved',
		icon: IconCheck,
		isPremium: false,
		category: 'general'
	},
	{
		name: 'assign_chat',
		icon: IconUser,
		isPremium: false,
		category: 'general'
	},
	{
		name: 'location',
		icon: IconLocation,
		isPremium: true,
		category: 'general'
	},
	{
		name: 'working_hours',
		icon: IconClock,
		isPremium: true,
		category: 'general'
	}
]

export const useFlowDragAndDrop = () => {
	const id = ref(0)
	const draggedType = ref<string | null>(null)
	const isDragOver = ref(false)
	const isDragging = ref(false)

	const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow()

	const getId = () => {
		return `dndnode_${id.value++}`
	}

	const onDragStart = (event: DragEvent, type: string | null) => {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/vueflow', type || '')
			event.dataTransfer.effectAllowed = 'move'
		}

		draggedType.value = type
		isDragging.value = true

		document.addEventListener('drop', onDragEnd)
	}

	const onDragOver = (event: DragEvent) => {
		event.preventDefault()

		if (draggedType.value) {
			isDragOver.value = true

			if (event.dataTransfer) {
				event.dataTransfer.dropEffect = 'move'
			}
		}
	}

	function onDragLeave() {
		isDragOver.value = false
	}

	function onDragEnd() {
		isDragging.value = false
		isDragOver.value = false
		draggedType.value = null
		document.removeEventListener('drop', onDragEnd)
	}

	function onDrop(event: DragEvent) {
		const position = screenToFlowCoordinate({
			x: event.clientX,
			y: event.clientY,
		})

		const nodeId = getId()

		const newNode = {
			id: nodeId,
			type: draggedType.value ?? undefined,
			position,
			data: { label: nodeId },
		}

		/**
		 * Align node position after drop, so it's centered to the mouse
		 *
		 * We can hook into events even in a callback, and we can remove the event listener after it's been called.
		 */
		const { off } = onNodesInitialized(() => {
			updateNode(nodeId, (node) => ({
				position: { x: node.position.x - node.dimensions.width / 2, y: node.position.y - node.dimensions.height / 2 },
			}))

			off()
		})

		addNodes(newNode)
	}

	watch(isDragging, (dragging) => {
		document.body.style.userSelect = dragging ? 'none' : ''
	})

	return {
		draggedType,
		isDragOver,
		isDragging,
		onDragStart,
		onDragLeave,
		onDragOver,
		onDrop,
	}
}
