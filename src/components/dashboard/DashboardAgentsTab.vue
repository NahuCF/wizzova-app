<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DashboardStatCard from '~/components/dashboard/DashboardStatCard.vue'
import { API } from '~/services'
import type { AgentStatsItem, AgentStatsSummary } from '~/types'

const props = defineProps<{
  startDate: string | null
  endDate: string | null
}>()

const { t } = useI18n()

const loading = ref(false)
const agentStats = ref<AgentStatsItem[]>([])
const summary = ref<AgentStatsSummary | null>(null)

const formatTime = (minutes: number | null): string => {
  if (minutes === null) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const fetchAgentStats = async () => {
  loading.value = true

  const params: Record<string, string> = {}
  if (props.startDate) {
    params.start_date = props.startDate
  }
  if (props.endDate) {
    params.end_date = props.endDate
  }

  try {
    const { data: response } = await API.dashboard.agentStats(params)
    summary.value = response.data.summary
    agentStats.value = response.data.agents
  } catch (error) {
    console.error(error)
  }

  loading.value = false
}

watch(
  () => [props.startDate, props.endDate],
  () => fetchAgentStats(),
)

fetchAgentStats()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <DashboardStatCard
        :label="t('dashboard.agents.total_open_conversations')"
        :count="summary?.total_active_conversations ?? 0"
        :tooltip="t('dashboard.tooltips.total_open_conversations')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('dashboard.agents.total_resolved')"
        :count="summary?.total_resolved ?? 0"
        :tooltip="t('dashboard.tooltips.total_resolved')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('dashboard.agents.total_messages_sent')"
        :count="summary?.total_messages_sent ?? 0"
        :tooltip="t('dashboard.tooltips.total_messages_sent')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('dashboard.agents.avg_resolution_time')"
        :count="formatTime(summary?.avg_resolution_time_minutes ?? null)"
        :tooltip="t('dashboard.tooltips.avg_resolution_time')"
        :loading="loading"
      />
      <DashboardStatCard
        :label="t('dashboard.agents.avg_first_response_time')"
        :count="formatTime(summary?.avg_first_response_time_minutes ?? null)"
        :tooltip="t('dashboard.tooltips.avg_first_response_time')"
        :loading="loading"
      />
    </div>

    <div class="bg-white border border-slate-200 rounded-lg">
      <DataTable
        :value="agentStats"
        :loading="loading"
        stripedRows
        :pt="{
          header: { class: 'border-b border-slate-200' },
        }"
      >
        <template #empty>
          <div class="text-center py-8 text-gray-500">
            {{ t('dashboard.agents.no_data') }}
          </div>
        </template>

        <Column :header="t('dashboard.agents.agent')">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <Avatar v-if="data.profile_img_path" :image="data.profile_img_path" shape="circle" />
              <Avatar v-else :label="data.name?.charAt(0)?.toUpperCase()" shape="circle" />
              <div class="flex flex-col">
                <span class="font-medium">{{ data.name }}</span>
                <span class="text-sm text-gray-500">{{ data.email }}</span>
              </div>
            </div>
          </template>
        </Column>

        <Column
          field="active_conversations"
          :header="t('dashboard.agents.active_conversations')"
        />

        <Column field="resolved" :header="t('dashboard.agents.resolved')" />

        <Column field="messages_sent" :header="t('dashboard.agents.messages_sent')" />

        <Column :header="t('dashboard.agents.avg_resolution_time')">
          <template #body="{ data }">
            {{ formatTime(data.avg_resolution_time_minutes) }}
          </template>
        </Column>

        <Column :header="t('dashboard.agents.avg_first_response_time')">
          <template #body="{ data }">
            {{ formatTime(data.avg_first_response_time_minutes) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
