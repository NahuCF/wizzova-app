<script setup lang="ts">
import { IconCopy, IconPencil, IconX } from '@tabler/icons-vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { ref, type Component } from 'vue'

const props = defineProps<{
	id: string,
	icon: Component,
	title: string,
	hideEdit?: boolean
}>()

const emit = defineEmits<{
	(e: 'onCopy'): void,
	(e: 'onEdit'): void,
	(e: 'onDelete'): void,
}>()

const { removeNodes } = useVueFlow()

const isHovered = ref(false)

const onDelete = () => {
	removeNodes([props.id])
	emit('onDelete')
}
</script>

<template>
	<div
		class="flex flex-col rounded-md border-2 border-emerald-500 max-w-[300px]"
		@mouseenter="isHovered = true"
		@mouseleave="isHovered = false"
	>
		<div class="flex justify-between bg-slate-200 py-2 px-4 gap-10">
			<div class="flex items-center gap-2">
				<component :is="icon" class="text-emerald-500" size="18" />
				<span class="text-lg text-slate-800">{{ title }}</span>
			</div>

			<div
				class="flex items-center gap-2"
				:class="[isHovered ? 'opacity-100' : 'opacity-0', 'transition-opacity duration-200']"
			>
				<IconCopy class="cursor-pointer text-slate-700" size="14" @click="emit('onCopy')" />
				<IconPencil v-if="!hideEdit" class="cursor-pointer text-slate-700" size="14" @click="emit('onEdit')" />
				<IconX class="cursor-pointer text-red-600" size="14" @click="onDelete" />
			</div>
		</div>

		<slot></slot>

		<slot name="handles">
			<Handle id="target" type="target" :position="Position.Left" :connectable="true" />
			<Handle id="source" type="source" :position="Position.Right" :connectable="true" />
		</slot>
	</div>
</template>