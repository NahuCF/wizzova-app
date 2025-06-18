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
  buttons: TemplateButton[]
}

export interface TemplateCreate {
  name: string,
  language_id: number,
  template_category_id: number,
  body: string,
  footer?: string
}

export interface TemplateButton {
  type: string,
  type_url?: string,
  category: string
}

export interface TemplateButtonOption {
  id: string,
  type: string,
  category: string,
  name: string,
  icon: string,
  description: string,
  maximun: number
}

export interface TemplateQuickReplyOption {
  type: string,
  maximun: number,
  category: string,
  text: string,
}

export type TemplateButtonsByCategory = Record<string, TemplateButton[]>