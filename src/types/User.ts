import type { PrimeVueSeverity } from "./PrimeVueDef"

export interface User {
  id: string
  email: string
  name: string
}

export interface UserItem {
  id: string
  email: string
  name: string,
  cellphone_number: string,
  cellphone_prefix: string,
  cellphone: string,
  role: Role,
  teams?: TeamItem[],
  permissions: Permission[],
  is_deleted: boolean,
  status: UserStatus
}

export type UserStatus = 'SIGNED_UP' | 'ACTIVE' | 'INACTIVE' | 'DELETED' | 'INVITATION_SENT' | 'INVITATION_ACCEPTED'

export const userStatusSeverity: { [status in UserStatus]: PrimeVueSeverity } = {
  'SIGNED_UP': 'info',
  'ACTIVE': 'success',
  'INACTIVE': 'warn',
  'DELETED': 'danger',
  'INVITATION_SENT': 'info',
  'INVITATION_ACCEPTED': 'success',
}

export interface UserCreate {
  id?: string,
  name: string,
  email: string,
  role: string,
  team_ids: string[]
}

export interface Permission {
  name: string,
  label: string,
  description: string
}

export interface PermissionList {
  data: Permission[],
  meta: {
    groups: {
      [key: string]: Permission[]
    }
  }
}

export interface Role {
  id: number,
  name: string,
  is_internal: boolean
}

export interface RoleItem {
  id: number,
  name: string,
  is_internal: boolean,
  permissions: Permission[],
  user: UserItem
}

export interface RoleCreate {
  id?: number,
  name: string,
  permissions: string[]
}

export interface TeamItem {
  id: string,
  name: string,
  users: UserItem[],
  owner: UserItem,
  users_count: number
}

export interface TeamCreate {
  id?: string,
  name: string,
  user_ids: string[]
}