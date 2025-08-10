<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import { DatePicker } from 'primevue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import Divider from 'primevue/divider'
import { useI18n } from 'vue-i18n'
import type { FilterColumn, Filter, FilterOperator } from '~/types'
import {
  IconX,
  IconPlus,
  IconTrash,
  IconFilter
} from '@tabler/icons-vue'

const props = defineProps<{
    columns: FilterColumn[]
    filters: Filter[],
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'update:filters', filters: Filter[]): void
}>()

const { t } = useI18n()

const menu = ref()
const popover = ref()
const filterButton = ref<any>()
const selectedColumn = ref<FilterColumn | null>(null)
const currentFilter = ref<{
    columnId: string
    conditions: { operator: FilterOperator | ''; value: any[] }[]
}>({
    columnId: '',
    conditions: []
})

const filters = computed({
    get: () => props.filters,
    set: (val: Filter[]) => emit('update:filters', val)
})

const menuItems = computed(() =>
    props.columns.map(col => ({
        label: col.name,
        action: (e: MouseEvent) => onColumnSelected(col, e),
        icon: col.icon || null
    }))
)

const showValueInput = (op: FilterOperator | '') =>
    op !== 'is_empty' && op !== 'is_not_empty' && op !== ''

const getOperatorOptions = (column: FilterColumn) =>
    column.operators.map(op => ({
        label: t(`filters.operators.${op}`),
        value: op
    }))

const getOptionsForColumn = (column: FilterColumn) => column.options || []

const openMenu = (event: MouseEvent) => {
    if (selectedColumn.value) popover.value?.hide()
    menu.value?.toggle(event)
}

const onColumnSelected = (column: FilterColumn, event: MouseEvent) => {
    selectedColumn.value = column
    const existingFilter = filters.value.find(f => f.columnId === column.id)
    if (existingFilter) {
        currentFilter.value = {
            columnId: column.id,
            conditions: existingFilter.conditions.map(cond => ({
                operator: cond.operator,
                value: [...cond.value]
            }))
        }
    } else {
        currentFilter.value = {
            columnId: column.id,
            conditions: [{ operator: column.operators[0] || '', value: [''] }]
        }
    }
    popover.value?.show(event)
}

const addFilter = () => {
    if (!selectedColumn.value) return

    const cleanedConditions = currentFilter.value.conditions
        .map(cond => {
            const operator = cond.operator

            const values = (operator === 'is_empty' || operator === 'is_not_empty')
                ? []
                : cond.value.filter(v => v !== '' && v !== null && v !== undefined)

            const labels = selectedColumn.value?.options
                ? values.map(v => selectedColumn.value!.options!.find(opt => opt.value === v)?.label ?? v)
                : values

            return {
                operator,
                value: values,
                labels
            }
        })
        .filter(cond =>
            cond.operator === 'is_empty' ||
            cond.operator === 'is_not_empty' ||
            cond.value.length > 0
        )

    if (!cleanedConditions.length) return

    const idx = filters.value.findIndex(f => f.columnId === selectedColumn.value!.id)
    const newFilter: Filter = {
        columnId: selectedColumn.value!.id,
        conditions: cleanedConditions
    }
    if (idx === -1) filters.value.push(newFilter)
    else filters.value[idx] = newFilter

    closePopover()
}

const closePopover = () => {
    popover.value?.hide()
    selectedColumn.value = null
    currentFilter.value = { columnId: '', conditions: [] }
}

const addCondition = () => {
    if (!selectedColumn.value) return
    const defaultOperator = selectedColumn.value.operators[0] || ''
    currentFilter.value.conditions.push({ operator: defaultOperator, value: [''] })
}

const removeCondition = (index: number) => {
    if (currentFilter.value.conditions.length > 1) currentFilter.value.conditions.splice(index, 1)
}

const addValue = (conditionIndex: number) => {
    currentFilter.value.conditions[conditionIndex].value.push('')
}

const removeValue = (conditionIndex: number, valueIndex: number) => {
    const condition = currentFilter.value.conditions[conditionIndex]
    if (condition.value.length > 1) condition.value.splice(valueIndex, 1)
}

const positionPopoverManually = () => {
    nextTick(() => {
        const popoverContainer = document.getElementById('my-popover')
        const buttonEl = filterButton.value?.$el
        if (!popoverContainer || !buttonEl) return

        const rect = buttonEl.getBoundingClientRect()
        popoverContainer.style.position = 'fixed'
        popoverContainer.style.top = `${rect.bottom}px`
        popoverContainer.style.left = `${rect.left}px`
    })
}

const dateModel = (conditionIndex: number, valueIndex: number) =>
    computed<Date | null>({
        get() {
            const val = currentFilter.value.conditions[conditionIndex].value[valueIndex]
            return val ? new Date(val) : null
        },
        set(newVal) {
            currentFilter.value.conditions[conditionIndex].value[valueIndex] =
                newVal instanceof Date && !isNaN(newVal.getTime())
                    ? newVal.toISOString().split('T')[0]
                    : ''
        }
    })
</script>

<template>
    <div>
        <Button 
            @click="openMenu" 
            severity="secondary" 
            class="bg-white! border-slate-200! hover:bg-slate-100!"
            :disabled="disabled"
            ref="filterButton"
        >
            <IconFilter size="14" class="mr-1" />
            <span class="text-sm">{{ $t('filter') }}</span>
        </Button>

        <Menu :model="menuItems" :popup="true" ref="menu">
            <template #item="{ item, props }">
                <div v-ripple v-bind="props.action" @click="item.action" class="flex items-center gap-2">
                    <component v-if="item.icon" :is="item.icon" class="text-gray-500" size="14" />
                    <span class="text-sm">{{ item.label }}</span>
                </div>
            </template>
        </Menu>

        <Popover id="my-popover" ref="popover" @show="positionPopoverManually" :dismissable="false"
            class="border rounded shadow w-sm">
            <div class="flex justify-between gap-2 p-3">
                <div class="flex items-center gap-2">
                    <component v-if="selectedColumn?.icon" :is="selectedColumn.icon" class="text-gray-500" size="14" />
                    <span class="text-sm">{{ selectedColumn?.name }}</span>
                </div>
                <Button severity="secondary" variant="text" rounded class="p-1!" size="small" @click="closePopover">
                    <IconX size="14" />
                </Button>
            </div>

            <Divider class="m-0! z-1" />

            <div class="max-h-[50vh] overflow-auto p-2.5">
                <template v-for="(condition, index) in currentFilter.conditions" :key="index">
                    <div class="flex items-center gap-2 mb-3">
                        <Select v-model="condition.operator" :options="getOperatorOptions(selectedColumn!)"
                            optionLabel="label" optionValue="value" class="flex-1" size="small" />
                        <Button v-if="currentFilter.conditions.length > 1" text @click="removeCondition(index)">
                            <IconTrash class="w-4 h-4 text-red-500" />
                        </Button>
                    </div>

                    <div v-if="showValueInput(condition.operator)">
                        <div class="flex items-center gap-2 mb-2" v-for="(val, valIdx) in condition.value"
                            :key="valIdx">
                            <!-- DATE -->
                            <DatePicker 
                                v-if="selectedColumn?.type === 'date'"
                                :modelValue="dateModel(index, valIdx).value" 
                                @update:modelValue="val => {
                                    if (val instanceof Date || val === null) {
                                        dateModel(index, valIdx).value = val
                                    }
                                }" 
                                class="flex-1" 
                                dateFormat="yy-mm-dd" 
                                mask="9999-99-99" 
                                placeholder="yyyy-mm-dd"
                                size="small"
                            />

                            <!-- NUMBER -->
                            <InputText 
                                v-else-if="selectedColumn?.type === 'number'" 
                                v-model="condition.value[valIdx]"
                                class="flex-1" v-keyfilter="/[0-9]/" 
                                :placeholder="t('filters.enter_value')"
                                size="small" 
                            />

                            <!-- SELECT or other with options -->
                            <Select 
                                v-else-if="selectedColumn?.options && selectedColumn.options.length > 0"
                                v-model="condition.value[valIdx]" 
                                class="flex-1"
                                :options="getOptionsForColumn(selectedColumn!)" 
                                :placeholder="t('filters.enter_value')"
                                optionLabel="label" 
                                optionValue="value"
                                size="small"  
                            />

                            <!-- Default to text input -->
                            <InputText 
                                v-else 
                                v-model="condition.value[valIdx]" 
                                class="flex-1"
                                :placeholder="t('filters.enter_value')"
                                size="small" 
                            />

                            <Button v-if="valIdx === condition.value.length - 1" text @click="addValue(index)">
                                <IconPlus class="w-4 h-4 text-gray-500" />
                            </Button>

                            <span v-if="valIdx < condition.value.length - 1" class="text-sm text-gray-500">
                                {{ $t('filters.or') }}
                            </span>

                            <Button v-if="condition.value.length > 1" text @click="removeValue(index, valIdx)">
                                <IconTrash class="w-4 h-4 text-red-500" />
                            </Button>
                        </div>
                    </div>

                    <Divider v-if="index < currentFilter.conditions.length - 1" align="left" type="solid">
                        {{ $t('filters.and') }}
                    </Divider>
                </template>

                <Button text size="small" @click="addCondition">
                    <IconPlus size="16" class="inline mr-1" />
                    {{ $t('filters.add_condition') }}
                </Button>
            </div>

            <Divider class="m-0!" />

            <div class="flex flex-col gap-2 p-3">
                <div class="flex justify-end gap-2">
                    <Button :label="$t('cancel')" text size="small" @click="closePopover" />
                    <Button :label="$t('apply')" size="small" @click="addFilter" />
                </div>
            </div>
        </Popover>
    </div>
</template>
