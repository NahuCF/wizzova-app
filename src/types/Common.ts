import type { Component } from "vue"

export type ActionItem = {
  label: string
  icon?: Component
  class?: string
  iconClass?: string
  disabled?: boolean,
  tooltip?: string
  action: () => void | Promise<void>
};

export type ActionGroup = ActionItem[];

export type ActionGenerator<T> = (item: T) => ActionGroup[]

export const createActions = <T>(config: (item: T) => (ActionGroup | null)[]): ActionGenerator<T> => {
  return (item: T) => {
    const groups = config(item)

    return groups.filter((group): group is ActionGroup => group !== null)
  }
}

export interface FilterColumn {
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

export type ColumnType = 'TAG' | 'TAG_LIST' | 'PROGRESS' | 'ACTIONS' | 'CUSTOM'

export interface Column {
  header: string,
  type?: ColumnType,
  key: string,
  bodyStyle?: Record<string, string>
}

export type LayoutMode = 'LIST' | 'GRID'