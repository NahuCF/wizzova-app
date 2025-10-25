<script setup lang="ts">
import { ref } from 'vue'
import { useBotStore, useContactFieldStore } from '~/stores'

const emit = defineEmits<{
	(event: 'onSelect', variableName: string): void,
	(event: 'onCreate'): void
}>()

const contactFieldStore = useContactFieldStore()
const botStore = useBotStore()

const variablesPopover = ref()

const toggle = (event: MouseEvent) => {
	variablesPopover.value?.toggle(event)
}

defineExpose({
	toggle,
	hide: () => variablesPopover.value?.hide(),
})
</script>

<template>
	<Popover ref="variablesPopover">
		<div class="pt-4 pb-2 min-w-[15rem] max-h-[300px] overflow-y-auto overflow-x-hidden">
			<li 
				class="py-2 px-3 hover:bg-slate-100 cursor-pointer" 
				@click="emit('onCreate')"
			>
				{{ $t('bot_workflow.create_variable') }}
			</li>

			<div v-if="botStore.variables.length > 0" class="font-semibold px-4 my-2">
				{{ $t('bot_workflow.bot_variables') }}
			</div>
			<ul class="list-none p-0 m-0 flex flex-col">
				<li 
					v-for="variable in botStore.variables" 
					:key="`default_${variable}`"
					class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
					@click="emit('onSelect', variable.name)"
				>
					{{ variable.name }}
				</li>
			</ul>

			<div v-if="contactFieldStore.contactFields.length > 0" class="font-semibold px-4 my-2">
				{{ $t('bot_workflow.contact_fields') }}
			</div>
			<ul class="list-none p-0 m-0 flex flex-col">
				<li 
					v-for="variable in contactFieldStore.contactFields" 
					:key="`default_${variable}`"
					class="py-2 px-3 hover:bg-slate-100 cursor-pointer"
					@click="emit('onSelect', `contact.${variable.name}`)"
				>
					{{ variable.name }}
				</li>
			</ul>
		</div>
	</Popover>
</template>