import type { TemplateBtn, TemplateCallBtn, TemplateHeaderCode, TemplateUrlBtn } from "./Template"

export type TemplateStatus = 'PENDING' | 'REJECTED'

export interface TemplateComponents {
  header: {
    type: TemplateHeaderCode,
    text: string
  } | []
  body: {
    content: string,
    variables?: {
      contact_field_id: string,
      name: string,
      value: string
    } []
  },
  footer: string,
  buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn) []
}

export interface TemplateItem {
  id: string,
  name: string,
  language: string,
  category: string,
  status: TemplateStatus,
  allow_category_change: false,
  components: TemplateComponents
  created_at: string
}

export type TemplateStatusStyle = {
  [color in TemplateStatus]: {
    iconName: string,
    color: string,
    backgroundColor: string
  }
}