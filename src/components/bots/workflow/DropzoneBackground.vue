<script lang="ts" setup>
import { Background } from '@vue-flow/background'
</script>

<template>
	<div class="w-full h-full">
		<Background
			variant="lines"
			:size="2"
			:gap="20"
			pattern-color="#e2e8f0"
		/>

		<div class="overlay">
			<slot />
		</div>
	</div>
</template>