<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import FlowNode from './FlowNode.vue'

const props = defineProps<NodeProps>()

const label = props.data?.label ?? 'No label'
</script>

<template>
	<FlowNode :label="label" />
</template>
