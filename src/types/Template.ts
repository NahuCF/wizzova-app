export interface TemplateCategory {
  id: number
  name: string
}

export interface TemplateHeaderType {
  id: number
  name: string
  code: string
}

export interface TemplateState {
  name: string,
  languageId: number,
  templateCategoryId: number,
  allowCategoryChange: boolean,
  constainsHeader: boolean,
  header: {
    typeId: number,
    text: string
  }
  body: string,
  footer: string,
  buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn) []
}

export interface TemplateCreate {
  name: string,
  language_id: number,
  template_category_id: number,
  body: string,
  footer?: string
}

export type TemplateBtnCategory = 'cta' | 'custom_reply'
export type TemplateBtnType = 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY' | 'EXPLORE_MORE'
export type TempalteBtnUrlType = 'static_url' | 'dynamic_url'

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
  text?: string
}

export interface TemplateUrlBtn extends TemplateBtn {
  type_url?: string,
  url?: string,
  example?: string,
}

export interface TemplateCallBtn extends TemplateBtn {
  phone_number?: string
}

export type TemplateButtonsByCategory = Record<string, (TemplateBtn | TemplateUrlBtn | TemplateCallBtn)[]>