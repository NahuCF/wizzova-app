import type { UserItem } from './User'
import type { Subscription } from './Subscription'

export interface LoginForm {
  email: string
  password: string
  tenant_id?: string
}

export interface RegisterForm {
  name: string
  company_name: string
  cellphone: string
  cellphone_prefix: string
  work_email: string
  password: string
}

export interface Tenant {
  id: string
  company_name: string
  is_profile_completed: boolean
  subscription?: Subscription
}

export interface LoginResponse {
  data: Tenant
  meta: {
    user: UserItem
    token: string
  }
}

export interface TenantsResponse {
  data: Tenant[]
}

export interface RegisterResponse {
  data: Tenant
}

export interface BusinessItem {
  id: string
  meta_business_id: number
  name: string
  wabas?: WABAItem[]
}

export interface WABAItem {
  id: string
  business_id: string
  meta_waba_id: string
  name: string
  currency: string
  timezone_id: string
  message_template_namespace: string
}
