export interface TemplateCategory {
  id: string
  name: string
}

export type TemplateHeaderCode = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

export interface TemplateHeaderType {
  id: string
  name: string
  code: TemplateHeaderCode
}

export interface TemplateCreate {
  id?: string,
  name: string,
  language: string,
  category: string,
  allow_category_change?: boolean,
  components: {
    header?: {
      type: TemplateHeaderCode,
      text: string
    }
    body: {
      text: string,
      variables: VariableMapping[]
    },
    footer?: string,
    buttons: TemplateButton[]
  }
}

export interface TemplateEdit {
  id: string,
  name: string,
  language: string,
  category: string,
  allow_category_change: boolean,
  components: {
    header: {
      type: TemplateHeaderCode,
      text: string
    } | []
    body: {
      content: string,
      variables?: VariableMapping[]
    },
    footer: string,
    buttons: TemplateButton[]
  },
  created_at: string
}

export type TemplateBtnCategory = 'cta' | 'custom_reply'
export type TemplateBtnType = 'STATIC_URL' | 'DYNAMIC_URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'EXPLORE_MORE'

export interface TemplateButtonOption {
  id: string,
  type: TemplateBtnType,
  category: TemplateBtnCategory,
  name?: string,
  icon: string,
  description?: string,
  maximun: number
}

export interface TemplateQuickReplyOption {
  type: 'QUICK_REPLY',
  category: TemplateBtnCategory,
  text: string,
  maximun: number
}

export interface TemplateBtn {
  type: TemplateBtnType,
  category: string,
  text: string
}

export interface TemplateUrlBtn extends TemplateBtn {
  type: 'STATIC_URL' | 'DYNAMIC_URL'
  url?: string,
  example?: string,
}

export interface TemplateCallBtn extends TemplateBtn {
  type: 'PHONE_NUMBER',
  phone_number: string,
  phone_number_prefix: string
}

export type TemplateButton = TemplateBtn | TemplateUrlBtn | TemplateCallBtn

export type TemplateButtonsByCategory = Record<string, (TemplateBtn | TemplateUrlBtn | TemplateCallBtn)[]>

export interface VariableMapping {
  contact_field_id?: string
  name: string
  value: string
}

export interface TemplateBroadcast {
  id: string,
  name: string,
  send_at: string,
  follow_whatsapp_business_policy: boolean,
  template_id: string,
  group_id: string,
  user_id: string
}