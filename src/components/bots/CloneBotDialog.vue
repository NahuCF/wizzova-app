<script setup lang="ts">
import { IconLoader2, IconClock } from '@tabler/icons-vue'
import moment from 'moment'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BroadcastRepeat } from '~/types'

defineProps<{
    visible: boolean,
    loading?: boolean
}>()

const emit = defineEmits<{
    (e: 'onConfirm', value: string): void,
    (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()

const name = ref('')

const canConfirm = computed(() => name.value.length > 0)

const onConfirm = () => {
	emit('onConfirm', name.value)
}
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal
        :draggable="false"
        :header="$t('bots.clone_title')" 
        class="min-w-[25rem] max-w-[450px]"
    >
		<div class="flex flex-col gap-2 pb-6">
			<div class="flex gap-2 text-ellipsis w-full py-1">
				<InputText 
					v-model="name" 
					:placeholder="$t('bots.create_form.name_placeholder')" 
					fluid
					id="name"
					name="name"
				/>
			</div>
		</div>
	
        <div class="flex justify-end gap-2">
            <Button type="button" severity="secondary" @click="emit('update:visible', false)">
				{{ $t('cancel') }}
			</Button>
            <Button type="button" :disabled="loading || !canConfirm" @click="onConfirm">
                <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                <span v-else>
                    {{ $t('clone') }}
                </span>
            </Button>
        </div>
    </Dialog>
</template>