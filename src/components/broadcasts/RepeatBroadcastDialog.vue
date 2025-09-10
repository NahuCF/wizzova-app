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
    (e: 'onConfirm', value: BroadcastRepeat): void,
    (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()

const sendOptions = ref([
    {
        name: t('new_broadcast.send_now'),
        value: 'SEND_NOW'
    },
    {
        name: t('new_broadcast.schedule_later'),
        value: 'SCHEDULE_LATER'
    }
])
const sendOption = ref<'SEND_NOW' | 'SCHEDULE_LATER'>('SEND_NOW')
const scheduledDate = ref<Date>()
const scheduledTime = ref<Date>()

const scheduledAt = computed(() => {
	if (!scheduledDate.value || !scheduledTime.value) return null

	return moment(scheduledDate.value)
		.hour(scheduledTime.value.getHours())
		.minute(scheduledTime.value.getMinutes())
		.second(scheduledTime.value.getSeconds())
		.toISOString()
})

const canConfirm = computed(() => {
	return sendOption.value === 'SEND_NOW' || scheduledAt.value
})

const onConfirm = () => {
	if (sendOption.value === 'SEND_NOW') {
		emit('onConfirm', { send_now: true })
	}
	else if(scheduledAt.value) {
		emit('onConfirm', { scheduled_at: scheduledAt.value })
	}
}
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal
        :draggable="false"
        :header="$t('broadcasts.repeat_broadcast')" 
        class="min-w-[25rem] max-w-[450px]"
    >
		<div class="flex flex-col gap-2 pb-6">
			<label for="name">
				{{ t('new_broadcast.send_broadcast') }}
			</label>

			<div class="flex gap-2 text-ellipsis w-full">
				<Select 
					id="sendOptions"
					class="w-full"
					v-model="sendOption" 
					:options="sendOptions"
					option-label="name"
					option-value="value"
				/>

				<DatePicker
					v-if="sendOption === 'SCHEDULE_LATER'"
					v-model="scheduledDate"
					class="w-full"
					showIcon
					iconDisplay="input"
					dateFormat="dd/mm/yy"
					mask="99/99/9999"
					:minDate="new Date()"
					:placeholder="t('new_broadcast.schedule_on')"
				/>

				<DatePicker
					v-if="sendOption === 'SCHEDULE_LATER'"
					v-model="scheduledTime"
					class="w-full"
					showIcon
					iconDisplay="input"
					:placeholder="t('new_broadcast.schedule_at')"
					hourFormat="12"
					:stepMinute="15"
					timeOnly
				>
					<template #inputicon="slotProps">
						<IconClock size="14" @click="slotProps.clickCallback" />
					</template>
				</DatePicker>
			</div>
		</div>
	
        <div class="flex justify-end gap-2">
            <Button type="button" severity="secondary" @click="emit('update:visible', false)">
				{{ $t('cancel') }}
			</Button>
            <Button type="button" :disabled="loading || !canConfirm" @click="onConfirm">
                <IconLoader2 v-if="loading" class="animate-spin w-6 h-6" />
                <span v-else>
                    {{ $t('broadcasts.repeat_broadcast') }}
                </span>
            </Button>
        </div>
    </Dialog>
</template>