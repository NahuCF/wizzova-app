<template>
	<div class="flow-node">
		<IconRobot /> <strong>Test node</strong>
	</div>
</template>

<script setup lang="ts">
import { IconRobot } from '@tabler/icons-vue'
</script>

<style scoped>
.flow-node {
	padding: 8px 12px;
	background: #6c63ff;
	color: white;
	border-radius: 8px;
	user-select: none;
	font-weight: bold;
	text-align: center;
}
</style>