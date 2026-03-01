import type { Page, PaginationMeta } from './Pagination'
import type { TemplateButton, TemplateHeaderCode } from './Template'

export type TemplateStatus = 'PENDING' | 'REJECTED' | 'APPROVED'

export interface TemplateComponents {
  header:
    | {
        type: TemplateHeaderCode
        text: string
      }
    | []
  body: {
    content: string
    variables?: {
      contact_field_id: string
      name: string
      value: string
    }[]
  }
  footer: string
  buttons: TemplateButton[]
}

export interface TemplateItem {
  id: string
  name: string
  language: string
  category: string
  status: TemplateStatus
  components: TemplateComponents
  created_at: string
  days_since_meta_update: number
  updated_count_while_approved: number
}

export type TemplateStatusStyle = {
  [color in TemplateStatus]: {
    iconName: string
    color: string
    backgroundColor: string
  }
}

export interface PaginationMetaWithTemplatesCount extends PaginationMeta {
  templates_count: number
}

export interface PageWithTemplatesCount<T> extends Page<T> {
  meta: PaginationMetaWithTemplatesCount
}
