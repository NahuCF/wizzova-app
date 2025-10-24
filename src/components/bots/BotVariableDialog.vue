<script setup lang="ts">
import { IconLoader2 } from '@tabler/icons-vue'
import { useToast } from 'primevue';
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n';
import { useErrorHandler } from '~/composables/useErrorHandler'
import { API } from '~/services'

defineProps<{
    visible: boolean,
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'onCreated', value: { id: string, name: string }): void,
    (e: 'update:visible', value: boolean): void
}>()

const toast = useToast()
const { t } = useI18n()
const handleError = useErrorHandler()

const name = ref('')
const loading = ref(false)

const canConfirm = computed(() => name.value.length > 0)

const onInput = (event: Event) => {
	const target = event.target as HTMLInputElement | null

	if(target) {
		name.value = target.value.replace(/[^a-zA-Z]/g, '_').toLowerCase()
	}
}

const onCreate = async () => {
	loading.value = true
	try {
		const { data: response } = await API.bot.createVariable(name.value)
		toast.add({ 
			severity: 'success',
			summary: 'Success', 
			detail: t('bot_workflow.variable_created_successfully'), 
			life: 3000 
		})
		emit('onCreated', response.data)
	} catch(error) {
		handleError(error)
	} finally {
		loading.value = false
	}

	emit('update:visible', false)
}
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal
        :draggable="false"
        :header="$t('bot_workflow.variable_dialog_title')" 
        class="min-w-[25rem] max-w-[450px]"
    >
		<div class="flex flex-col gap-2 pb-6">
			<div class="flex gap-2 text-ellipsis w-full py-1">
				<InputText 
					v-model="name" 
					:placeholder="$t('bot_workflow.variable_name_placeholder')" 
					fluid
					v-keyfilter="/[a-zA-Z ]/"
					id="name"
					name="name"
					@input="onInput"
				/>
			</div>
			<span class="text-gray-500 text-sm">{{ $t('bot_workflow.variable_sample_value') }}</span>
		</div>
	
        <div class="flex justify-end gap-2">
            <Button type="button" severity="secondary" @click="emit('update:visible', false)">
				{{ $t('cancel') }}
			</Button>
            <Button type="button" :disabled="loading || !canConfirm" @click="onCreate">
                <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                <span v-else>
                    {{ $t('create') }}
                </span>
            </Button>
        </div>
    </Dialog>
</template>