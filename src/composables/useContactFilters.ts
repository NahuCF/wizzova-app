import { IconCircleDot, IconHash, IconTypography, IconTextWrap, 
    IconUserCircle, IconToggleLeft, IconCalendar } from "@tabler/icons-vue"
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { useContactFieldStore, useUserStore } from "~/stores"
import type { ContactFieldType, FilterOperator, Column, ContactFilterCondition, Filter } from "~/types"

export function useContactFilters() {
    const { t } = useI18n()
    const contactFieldStore = useContactFieldStore()
    const userStore = useUserStore()

    const operatorsByType: Record<ContactFieldType, FilterOperator[]> = {
        TEXT: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
        MULTI_TEXT: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
        SELECT: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
        SWITCH: ['is', 'is_not', 'is_empty', 'is_not_empty'],
        USER: ['contains', 'not_contains', 'is_empty', 'is_not_empty'],
        DATE: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
        NUMBER: ['is', 'is_not', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty']
    }

    const iconsByType: Record<ContactFieldType, Component> = {
        SELECT: IconCircleDot,
        NUMBER: IconHash,
        TEXT: IconTypography,
        MULTI_TEXT: IconTextWrap,
        USER: IconUserCircle,
        SWITCH: IconToggleLeft,
        DATE: IconCalendar
    }

    const columns = computed<Column[]>(() => {
        return contactFieldStore.contactFields
            .map(field => {
                let options: { label: string; value: any }[] | undefined

                if (field.type === 'USER') {
                    options = userStore.users.map(user => ({
                        label: user.name,
                        value: user.id
                    }))
                } else if (field.options && field.options.length) {
                    options = field.options.map(opt => ({ label: opt, value: opt }))
                } else if (field.type === 'SWITCH') {
                    options = [
                        { label: t('yes'), value: true },
                        { label: t('no'), value: false }
                    ]
                }

                return {
                    id: field.id,
                    name: field.name,
                    type: field.type.toLowerCase(),
                    operators: operatorsByType[field.type] || ['contains', 'is', 'is_not'],
                    icon: iconsByType[field.type] || null,
                    options
                }
            })
    })

    const flattenFilters = (filters: Filter[]) => {
        return filters.flatMap(filter =>
            filter.conditions.map(cond => ({
                contact_field_id: filter.columnId,
                operator: cond.operator,
                value: cond.value
            }))
        ).filter((f): f is ContactFilterCondition => f.operator !== "")
    }

    const unflattenFilters = (flatFilters: ContactFilterCondition[]): Filter[] => {
        const grouped: Record<string, Filter> = {}

        for (const { contact_field_id, operator, value } of flatFilters) {
            if (!grouped[contact_field_id]) {
                grouped[contact_field_id] = {
                    columnId: contact_field_id,
                    conditions: []
                }
            }

            const filter = grouped[contact_field_id]

            filter.conditions.push({
                operator,
                value: [...value]
            })
        }

        return Object.values(grouped)
    }



    return {
        columns,
        flattenFilters,
        unflattenFilters
    }
}