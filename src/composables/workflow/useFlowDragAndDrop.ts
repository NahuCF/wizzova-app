import { 
	IconCheck, IconClock, IconFile, IconLocation, 
	IconMathLower, IconMessage, IconPhoto, IconQuestionMark, 
	IconTemplate, IconUser, IconVideo, IconVolume
} from '@tabler/icons-vue'
import { useVueFlow } from '@vue-flow/core'
import { ref, watch, type Component } from 'vue'
import type { BotNodeType, MediaNodeType } from '~/types'

export type BotNodeCategory = 'send_message' | 'question' | 'general'
export type BotNodeItem = {
	name: BotNodeType,
	icon: Component,
	isPremium: boolean,
	category: BotNodeCategory,
	default: any
}

export const nodeItems: BotNodeItem[] = [
	{
		name: 'message',
		icon: IconMessage,
		isPremium: false,
		category: 'send_message',
		default: {
			content: ''
		}
	},
	{
		name: 'template',
		icon: IconTemplate,
		isPremium: true,
		category: 'send_message',
		default: {}
	},
	{
		name: 'image',
		icon: IconPhoto,
		isPremium: false,
		category: 'send_message',
		default: {}
	},
	{
		name: 'video',
		icon: IconVideo,
		isPremium: true,
		category: 'send_message',
		default: {}
	},
	{
		name: 'audio',
		icon: IconVolume,
		isPremium: true,
		category: 'send_message',
		default: {}
	},
	{
		name: 'document',
		icon: IconFile,
		isPremium: false,
		category: 'send_message',
		default: {}
	},
	{
		name: 'question_button',
		icon: IconQuestionMark,
		isPremium: false,
		category: 'question',
		default: {}
	},
	{
		name: 'condition',
		icon: IconMathLower,
		isPremium: false,
		category: 'general',
		default: {
			conditions: []
		}
	},
	{
		name: 'mark_as_solved',
		icon: IconCheck,
		isPremium: false,
		category: 'general',
		default: {}
	},
	{
		name: 'assign_chat',
		icon: IconUser,
		isPremium: false,
		category: 'general',
		default: {}
	},
	{
		name: 'location',
		icon: IconLocation,
		isPremium: true,
		category: 'general',
		default: {}
	},
	{
		name: 'working_hours',
		icon: IconClock,
		isPremium: true,
		category: 'general',
		default: {}
	}
]

export const defaultSupportedFormats: Record<MediaNodeType, string[]> = {
	image: ['image/jpeg', 'image/png'],
	video: ['video/mp4', 'video/3gpp'],
	audio: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/amr', 'audio/ogg'],
	document: [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'application/vnd.ms-excel',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-powerpoint',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		'text/plain',
	],
}

export const defaultMBLimit: Record<MediaNodeType, number> = {
	image: 5,
	video: 16,
	audio: 16,
	document: 30,
}

export const useFlowDragAndDrop = () => {
	const draggedType = ref<string | null>(null)
	const draggedData = ref<Record<string, any>>({})
	const isDragOver = ref(false)
	const isDragging = ref(false)

	const { addNodes, screenToFlowCoordinate, onNodesInitialized, updateNode } = useVueFlow()

	const onDragStart = ({ event, nodeItem }: { event: DragEvent, nodeItem: BotNodeItem }) => {
		if (event.dataTransfer) {
			event.dataTransfer.setData('application/vueflow', nodeItem.name)
			event.dataTransfer.effectAllowed = 'move'
		}

		draggedType.value = nodeItem.name
		draggedData.value = { ...nodeItem.default }
		isDragging.value = true

		document.addEventListener('dragend', onDragEnd)
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

	const onDragLeave = () => {
		isDragOver.value = false
	}

	const onDragEnd = () => {
		isDragging.value = false
		isDragOver.value = false
		draggedType.value = null
		document.removeEventListener('dragend', onDragEnd)
	}

	const onDrop = (event: DragEvent) => {
		const position = screenToFlowCoordinate({
			x: event.clientX,
			y: event.clientY,
		})

		const nodeId = crypto.randomUUID()

		const newNode = {
			id: nodeId,
			type: draggedType.value ?? undefined,
			position,
			data: { ...draggedData.value },
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

	const addNodeInCenter = (nodeItem: BotNodeItem) => {
		const center = screenToFlowCoordinate({
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		})

		const nodeId = crypto.randomUUID()

		const newNode = {
			id: nodeId,
			type: nodeItem.name,
			position: center,
			data: { ...nodeItem.default },
		}

		const { off } = onNodesInitialized(() => {
			updateNode(nodeId, (node) => ({
				position: {
					x: node.position.x - node.dimensions.width / 2,
					y: node.position.y - node.dimensions.height / 2,
				},
			}))
			off()
		})

		addNodes(newNode)
	}

	watch(isDragging, (dragging) => {
		document.body.style.userSelect = dragging ? 'none' : ''
	})

	return {
		isDragOver,
		isDragging,
		onDragStart,
		onDragLeave,
		onDragOver,
		onDrop,
		addNodeInCenter
	}
}
