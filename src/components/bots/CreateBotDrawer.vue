<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconAsterisk, IconLoader2, IconInfoCircle, IconPlus, IconTrash } from '@tabler/icons-vue'
import type { BotCreate } from '~/types/Bot'

const props = defineProps<{
	title: string,
    visible: boolean,
    loading: boolean,
    botEdited?: BotCreate
}>()
const emit = defineEmits<{
    (e: 'onSave', payload: BotCreate): void
    (e: 'update:visible', value: boolean): void
}>()

const bot = ref<BotCreate>({
    id: '',
    name: '',
	trigger_type: 'any_message'
})

const addKeyword = () => {
	if(bot.value.keywords) {
		bot.value.keywords = [
			...bot.value.keywords,
			{
				value: '',
				case_match: false
			}
		]
	}
}

const removeKeyword = (index: number) => {
	if(bot.value.keywords) {
		bot.value.keywords = bot.value.keywords.filter((_, i) => i !== index)
	}
}

const canSubmit = () => {
	return bot.value.name.length > 0
}

const onConfirm = () => {
    emit('onSave', bot.value)
}

watch(() => props.visible, () => {
    if (!props.visible) {
        return
    }

    if(props.botEdited) {
        bot.value = props.botEdited
    }
    else {
        bot.value = {
            id: '',
            name: '',
            trigger_type: 'any_message'
        }
    }
})

watch(() => bot.value.trigger_type, () => {
	if(bot.value.trigger_type === 'keyword') {
		bot.value.keywords = [
			{
				value: '',
				case_match: false
			}
		]
	}
	else {
		delete bot.value.keywords
	}
})
</script>

<template>
    <Drawer 
		:visible="visible" 
		@update:visible="emit('update:visible', $event)" 
		class="w-[512px]!" 
		:header="title" 
		position="right"
	>
		<Divider class="mt-2!" />

        <div class="flex flex-col gap-6 pt-6">
            <div class="flex flex-col gap-1 relative">
                <div class="flex gap-1">
                    <label class="text-lg text-neutral-800! font-medium" for="name">
						{{ $t('bots.create_form.name') }}
					</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                <InputText 
                    v-model="bot.name" 
                    :placeholder="$t('bots.create_form.name_placeholder')" 
                    fluid
                    id="name"
                    name="name"
                />
            </div>

            <div class="flex flex-col items-start gap-3 relative">
                <div class="flex gap-1 w-full">
                    <label class="text-lg text-neutral-800! font-medium" for="when_to_trigger">
						{{ $t('bots.create_form.when_to_trigger') }}
					</label>
                    <IconAsterisk color="red" class="mt-1" size="8" />
                </div>
                
                <div class="flex gap-2 w-full">
					<div class="flex items-center gap-2">
						<RadioButton
							v-model="bot.trigger_type"
							inputId="any_message"
							value="any_message"
						/>
						<label for="any_message" class="text-lg font-normal cursor-pointer">
							{{ $t('bots.create_form.for_any_message') }}
						</label>
					</div>
					<div class="flex items-center gap-2">
						<RadioButton
							v-model="bot.trigger_type"
							inputId="keyword"
							value="keyword"
						/>
						<label for="keyword" class="text-lg font-normal cursor-pointer">
							{{ $t('bots.create_form.for_specific_keywords') }}
						</label>
					</div>
				</div>

				<div v-for="(keyword, index) in bot.keywords" class="flex flex-col w-full gap-4 relative bg-slate-100 p-3 rounded-xl">
					<div class="flex flex-col gap-2 relative">
						<div class="flex items-center justify-between">
							<label class="text-lg text-neutral-800! font-medium" for="name">
								{{ $t('bots.create_form.keyword') }}
							</label>
							<Button
								class="p-2 hover:cursor-pointer hover:bg-red-50 transition rounded-md"
								variant="text"
								:disabled="bot.keywords?.length === 1"
								@click="removeKeyword(index)"
							>
								<IconTrash class="text-red-400" size="16" />
							</Button>
						</div>
						<InputText 
							v-model="keyword.value" 
							:placeholder="$t('bots.create_form.keyword_placeholder')" 
							fluid
							id="keyword"
							name="keyword"
						/>
					</div>

					<div class="flex items-center gap-2">
						<label :for="`caseMatch${index}`" class="text-lg font-normal cursor-pointer"> 
							{{ $t('bots.create_form.case_match') }} 
						</label>
						<div v-tooltip.bottom="{
							value: $t('bots.create_form.case_match_tooltip'),
							class: 'max-w-[300px]!'
						}">
							<IconInfoCircle class="text-gray-400 hover:cursor-pointer" size="16" />
						</div>
						<Checkbox v-model="keyword.case_match" :inputId="`caseMatch${index}`" name="caseMatch" binary />
					</div>
				</div>

				<Button
					v-if="bot.trigger_type === 'keyword'"
					class="text-primary underline"
					severity="secondary"
					variant="link"
					@click="addKeyword"
				>
					<IconPlus size="16" />
					<span>{{ $t('bots.create_form.add_keyword') }}</span>
				</Button>
            </div>
		</div>

		<template #footer>
            <div class="flex justify-end gap-4">
                <Button class="bg-white! border-slate-200! hover:bg-slate-100!" severity="secondary"
                    @click="emit('update:visible', false)">
                    {{ $t('cancel') }}
                </Button>
                <Button
                    :disabled="loading || !canSubmit()"
                    v-tooltip.top="!canSubmit() && {
						value: $t('teams.create_team_tooltip'),
						class: 'max-w-[300px]!'
					}"
                    @click="onConfirm" 
                >
                    <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                    <span v-else>{{ $t('submit') }}</span>
                </Button>
            </div>
        </template>
	</Drawer>
</template>

<style lang="css" scoped>
:deep(.p-drawer-content) {
    padding-bottom: 0 !important;
}
</style>