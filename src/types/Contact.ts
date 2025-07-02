export type ContactFieldType = 'SELECT' | 'NUMBER' | 'TEXT' | 'MULTI_TEXT' | 'USER' | 'SWITCH' | 'DATE'

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
    fields: ContactItemField[]
}

export interface CreateContact {
    id: string,
    fields: {
        id: string,
        name: string,
        value: string | string[] | number | boolean
    } []
}