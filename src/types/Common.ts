import type { Component } from "vue"

export interface DropdownOption {
	label: string
	icon?: Component
	class?: string
	action: (selectedItem?: any) => void
}

export interface Column {
  id: string
  name: string
  type: string
  operators: FilterOperator[]
  icon?: any | null
  options?: { label: string; value: any }[]
}

export interface Filter {
  columnId: string
  conditions: { operator: FilterOperator | ''; value: any[] }[]
}

export type FilterOperator =
  | 'is'
  | 'is_not'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'before'
  | 'after'
  | 'greater_than'
  | 'less_than'

export interface FilterCondition {
  operator: FilterOperator | ''
  value: string[]
}