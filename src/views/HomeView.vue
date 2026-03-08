<script setup lang="ts">
import { computed } from 'vue'
import { IconChartBar, IconUsers, IconRefresh, IconCrown } from '@tabler/icons-vue'
import DashboardOverviewTab from '~/components/dashboard/DashboardOverviewTab.vue'
import DashboardAgentsTab from '~/components/dashboard/DashboardAgentsTab.vue'
import { useDateRangeFilter } from '~/composables/useDateRangeFilter'
import { useFeatureAccess } from '~/composables/useFeatureAccess'

const { hasFeature, requireFeature } = useFeatureAccess()
const isAgentsLocked = computed(() => !hasFeature('user_analytics'))

const {
  periodOptions,
  selectedPeriod,
  dateRange,
  dateRangeError,
  startDate,
  endDate,
  canRefresh,
  refreshKey,
  refreshData,
} = useDateRangeFilter()

const onLockedTabClick = (feature: string) => {
  requireFeature(feature)
}
</script>

<template>
  <div class="flex flex-col">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-0">
      <h1 class="text-2xl font-bold">{{ $t('dashboard.title') }}</h1>

      <div class="flex flex-col items-end gap-1">
        <div class="flex gap-3 items-center">
          <Button
            class="bg-white! border-slate-200! hover:bg-slate-100!"
            severity="secondary"
            :disabled="!canRefresh"
            @click="refreshData"
          >
            <IconRefresh size="16" />
          </Button>
          <Select
            v-model="selectedPeriod"
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            class="w-48"
          />
          <DatePicker
            v-model="dateRange"
            selectionMode="range"
            :manualInput="false"
            showIcon
            iconDisplay="input"
            :placeholder="$t('dashboard.select_date_range')"
          >
            <template #footer>
              <Divider class="my-2!" />
              <div class="flex justify-between">
                <Button
                  class="text-base!"
                  variant="text"
                  size="small"
                  @click="dateRange = [new Date(), new Date()]"
                >
                  {{ $t('today') }}
                </Button>
                <Button class="text-base!" variant="text" size="small" @click="dateRange = null">
                  {{ $t('reset') }}
                </Button>
              </div>
            </template>
          </DatePicker>
        </div>
        <span v-if="dateRangeError" class="text-sm text-red-500">{{ dateRangeError }}</span>
      </div>
    </div>

    <Tabs value="0" class="py-4" lazy>
      <TabList class="text-lg">
        <Tab value="0">
          <div class="flex items-center gap-2 text-inherit">
            <IconChartBar size="16" />
            <span>{{ $t('dashboard.tabs.overview') }}</span>
          </div>
        </Tab>
        <div v-if="isAgentsLocked" @click="onLockedTabClick('user_analytics')" class="cursor-pointer">
          <Tab value="1" :disabled="true">
            <div class="flex items-center gap-2">
              <IconUsers size="16" />
              <span>{{ $t('dashboard.tabs.agents') }}</span>
              <IconCrown class="text-amber-400" size="16" />
            </div>
          </Tab>
        </div>
        <Tab v-else value="1">
          <div class="flex items-center gap-2 text-inherit">
            <IconUsers size="16" />
            <span>{{ $t('dashboard.tabs.agents') }}</span>
          </div>
        </Tab>
      </TabList>
      <TabPanels class="p-6!">
        <TabPanel value="0">
          <DashboardOverviewTab :start-date="startDate" :end-date="endDate" :refresh-key="refreshKey" />
        </TabPanel>
        <TabPanel value="1">
          <DashboardAgentsTab :start-date="startDate" :end-date="endDate" :refresh-key="refreshKey" />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
