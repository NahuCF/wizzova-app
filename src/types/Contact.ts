import type { FilterCondition, FilterOperator } from "./Common"
import type { UserItem } from "./User"

export type ContactFieldType = 'SELECT' | 'NUMBER' | 'TEXT' | 'MULTI_TEXT' | 'USER' | 'SWITCH' | 'DATE'
export type ContactImportMode = 'ADD' | 'ADD_AND_REPLACE'
export type ContactImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED'

export interface ContactFieldItem {
    id: string,
    name: string,
    internal_name: string,
    type: ContactFieldType,
    is_mandatory: boolean,
    is_active: boolean,
    is_primary_field: boolean,
    options?: string[]
}

export interface ContactFieldCreate {
    id: string
    name: string,
    internal_name: string,
    is_mandatory: boolean,
    type: ContactFieldType,
    options?: string[]
}

export interface ContactItemField {
    field_value_id: string,
    name: string,
    value: string | string[] | boolean
}

export interface ContactItem {
    id: string,
    fields: ContactItemField[],
    active_broadcast_count?: number
}

export type ContactFieldValue = string | string[] | number | boolean
export type ContactFieldRecord = Record<string, ContactFieldValue | undefined>

export interface CreateContact {
    id: string,
    fields: {
        id: string,
        name: string,
        value: ContactFieldValue
    }[]
}

export interface MappingContact {
    excelColumn: string
    value: ContactFieldValue
    contactField: ContactFieldItem | null
    status: 'MAPPED' | 'NOT_MAPPED'
}

export interface ContactImportItem {
    id: string,
    name: string,
    user: UserItem,
    import_type: ContactImportMode,
    added_contacts_count: number,
    error_contacts_count: number,
    total_contacts_count: number,
    status: ContactImportStatus,
    created_at: string
}

export interface ContactFilter {
    contactFieldId: string
    conditions: FilterCondition[]
}

export interface ContactFilterCondition {
    contact_field_id: string,
    operator: FilterOperator,
    value: string[]
}

export interface ContactGroupItem {
    id: string,
    name: string,
    contact_count: number,
    user: UserItem,
    filters: ContactFilterCondition[]
    updated_at: string
}

export interface CreateContactGroup {
    id: string,
    name: string,
    filters: ContactFilterCondition[]
}

export type ContactFormValue = string | number | boolean | string[] | Date | null

export type ContactFormExpose = {
  	validate: () => {
        id: string,
        name: string,
        value: ContactFieldValue
    } [],
    reset: () => void
}