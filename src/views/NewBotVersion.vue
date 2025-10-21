<script setup lang="ts">
import { IconArrowLeft, IconPencil, IconLoader2, IconAsterisk } from '@tabler/icons-vue'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type BotWorkflow from '~/components/bots/workflow/BotWorkflow.vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'
import type { BotEdge, BotItem, BotNode, BotNodeType, BotViewport } from '~/types'

type RawNode = {
	id: string,
	position: { x: number; y: number },
	type?: string,
	data: any
}

const validNodeTypes: BotNodeType[] = [
	'message', 'template', 'image', 'video', 'audio', 'document',
	'question_button', 'condition', 'start_again', 'mark_as_solved', 'assign_chat',
	'location', 'working_hours', 'set_variable'
]

const route = useRoute()
const router = useRouter()
const handleError = useErrorHandler()

const workflow = ref<InstanceType<typeof BotWorkflow> | null>(null)
const botId = ref<string>()
const versionId = ref<string>()
const name = ref('')
const editName = ref(false)
const saving = ref(false)
const nodes = ref<BotNode[]>([])
const edges = ref<BotEdge[]>([])

const isBotNodeType = (type: string | undefined): type is BotNodeType => {
  	return typeof type === 'string' && validNodeTypes.includes(type as BotNodeType)
}

const loadBot = async () => {
	const id = route.params.id
	const versionParamId = route.params.versionId

	if(typeof id === 'string') {
		botId.value = id
	}

	if(typeof versionParamId === 'string') {
		versionId.value = versionParamId
	}
	
	if(botId.value && versionId.value) {
		try {
			const { data: versionData } = await API.botVersion.getData(botId.value, versionId.value)

			name.value = versionData.name
			nodes.value = versionData.nodes
			edges.value = versionData.edges

			const startNode = nodes.value.find(node => !edges.value.find(edge => edge.target === node.id))
			if(startNode) {
				edges.value = [
					{
						id: 'start_edge',
						source: 'start',
						target: startNode.id
					},
					...edges.value
				]
			}
		} catch(error) {
			console.log(error)
		}
	}
}

const goToVersions = () => {
	if(!botId.value) return

	router.push({ 
		name: 'bot-details',
		params: { id: botId.value },
		query: {
			tab: 'versions'
		}
	})
}

const onSave = async () => {
	const flowData = workflow.value?.save()
	if(!flowData || !botId.value) return
	
	saving.value = true
	try {
		const nodes: BotNode[] = flowData.nodes
			.filter((n): n is RawNode & { type: BotNodeType } => isBotNodeType(n.type))
			.map((n): BotNode => {
				return {
					id: n.id,
					position: n.position,
					type: n.type,
					data: n.data
				}
			})

		const edges: BotEdge[] = flowData.edges.filter(edge => edge.source !== 'start')
		const viewport: BotViewport = flowData.viewport

		const payload = {
			id: versionId.value || '',
			name: name.value,
			nodes,
			edges,
			viewport
		}

		if(versionId.value) {
			const { data: response } = await API.botVersion.update(botId.value, payload)
		}
		else {
			const { data: response } = await API.botVersion.create(botId.value, payload)
		}
		
		goToVersions()
	} catch(error) {
		handleError(error)
	} finally {
		saving.value = false
	}
}

loadBot()
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
						:placeholder="$t('new_botflow.no_name')" 
						fluid
						id="name"
						name="name"
						@focusout="editName = false"
					/>
				</div>
				<div v-else class="flex gap-1 text-lg text-slate-500 pl-2">
					{{ name || $t('new_botflow.no_name') }}
					<IconAsterisk v-if="name.trim().length === 0" color="red" size="8" />
				</div>
				<Button variant="text" @click="editName = !editName" class="p-1!" severity="secondary">
					<IconPencil size="18" />
				</Button>
			</div>

			<div>
				<Button @click="onSave" :disabled="saving || name.trim().length === 0">
					<IconLoader2 v-if="saving" class="animate-spin w-6 h-6" />
					<span v-else>
						{{ $t(`save`) }}
					</span>
				</Button>
			</div>
		</div>
		<BotWorkflow ref="workflow" :nodes="nodes" :edges="edges" />
	</div>
</template>