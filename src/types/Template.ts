export interface TemplateCategory {
  id: number
  name: string
}

export type TemplateHeaderCode = 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT'

export interface TemplateHeaderType {
  id: string
  name: string
  code: TemplateHeaderCode
}

export interface TemplateState {
  name: string,
  languageId: number,
  category: string,
  allowCategoryChange: boolean,
  constainsHeader: boolean,
  header: {
    type: TemplateHeaderCode,
    text: string
  }
  body: {
    text: string,
    variables: VariableMapping []
  },
  footer: string,
  buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn) []
}

export interface TemplateCreate {
  name: string,
  language_id: number,
  category: string,
  components: {
    header?: {
      type: TemplateHeaderCode,
      text: string
    }
    body: {
      text: string,
      variables: VariableMapping []
    },
    footer?: string,
    buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn) []
  }
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
  type: TemplateBtnType,
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
  url: string,
  example?: string,
}

export interface TemplateCallBtn extends TemplateBtn {
  phone_number: string,
  phone_number_prefix: string
}

export type TemplateButtonsByCategory = Record<string, (TemplateBtn | TemplateUrlBtn | TemplateCallBtn)[]>

export interface VariableMapping {
  contact_field_id?: string
  name: string
  value: string
}