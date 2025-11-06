<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconSearch } from '@tabler/icons-vue'
import { useBotStore, useContactFieldStore } from '~/stores'

const emit = defineEmits<{
	(event: 'onSelect', variableName: string): void,
	(event: 'onCreate'): void
}>()

const contactFieldStore = useContactFieldStore()
const botStore = useBotStore()

const variablesPopover = ref()
const searchQuery = ref('')
const activeTab = ref<'contact' | 'bot'>('contact')

const filteredContactFields = computed(() => {
	if (!searchQuery.value) return contactFieldStore.contactFields
	return contactFieldStore.contactFields.filter(field =>
		field.name.toLowerCase().includes(searchQuery.value.toLowerCase())
	)
})

const filteredBotVariables = computed(() => {
	if (!searchQuery.value) return botStore.variables
	return botStore.variables.filter(variable =>
		variable.name.toLowerCase().includes(searchQuery.value.toLowerCase())
	)
})

const toggle = (event: MouseEvent) => {
	variablesPopover.value?.toggle(event)
	searchQuery.value = ''
	activeTab.value = 'contact'
}

const selectVariable = (variableName: string) => {
	emit('onSelect', variableName)
	variablesPopover.value?.hide()
	searchQuery.value = ''
}

defineExpose({
	toggle,
	hide: () => variablesPopover.value?.hide(),
})
</script>

<template>
	<Popover ref="variablesPopover">
		<div class="min-w-[20rem] max-h-[400px] flex flex-col">
			<!-- Search Bar -->
			<div class="p-3 ">
				<InputGroup>
					<InputGroupAddon>
						<IconSearch size="16" />
					</InputGroupAddon>
					<InputText 
						v-model="searchQuery" 
						:placeholder="$t('search')"
						class="w-full"
					/>
				</InputGroup>
			</div>

			<Tabs v-model:value="activeTab" class="flex-1 flex flex-col">
				<TabList>
					<Tab value="contact">Campos de contacto</Tab>
					<Tab value="bot">Variables de bot</Tab>
				</TabList>
				
				<TabPanels class="flex-1 overflow-y-auto">
					<!-- Contact Fields Panel -->
					<TabPanel value="contact" class="p-0">
						<div v-if="filteredContactFields.length === 0" class="px-4 py-3 text-gray-500 text-center">
							{{ searchQuery ? $t('no_results') : $t('bot_workflow.no_contact_fields') }}
						</div>
						<ul v-else class="list-none p-0 m-0">
							<li 
								v-for="field in filteredContactFields" 
								:key="`contact_${field.id}`"
								class="py-2 px-4 hover:bg-slate-100 cursor-pointer flex items-center justify-between"
								@click="selectVariable(`contact.${field.name}`)"
							>
								<span>{{ field.name }}</span>
							</li>
						</ul>
					</TabPanel>

					<!-- Bot Variables Panel -->
					<TabPanel value="bot" class="p-0">
						<div class="px-4 py-2">
							<button 
								class="w-full cursor-pointer py-2 px-3 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors flex items-center justify-center gap-2"
								@click="emit('onCreate'); variablesPopover?.hide()"
							>
								<span class="text-lg">+</span>
								{{ $t('bot_workflow.create_variable') }}
							</button>
						</div>
						
						<div v-if="filteredBotVariables.length === 0" class="px-4 py-3 text-gray-500 text-center">
							{{ searchQuery ? $t('no_results') : $t('bot_workflow.no_bot_variables') }}
						</div>
						<ul v-else class="list-none p-0 m-0">
							<li 
								v-for="variable in filteredBotVariables" 
								:key="`bot_${variable.id}`"
								class="py-2 px-4 hover:bg-slate-100 cursor-pointer"
								@click="selectVariable(variable.name)"
							>
								{{ variable.name }}
							</li>
						</ul>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</div>
	</Popover>
</template>