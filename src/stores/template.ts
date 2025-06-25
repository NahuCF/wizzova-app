import { defineStore } from 'pinia'
import type { TemplateState, TemplateButtonsByCategory, TemplateUrlBtn, TemplateCallBtn } from '~/types' 

const initState = (): { template: TemplateState } => ({
  template: {
    name: '',
    languageId: 0,
    category: '',
    allowCategoryChange: false,
    constainsHeader: false,
    footer: '',
    body: {
      text: '',
      variables: {}
    },
    header: {
      type: 'NONE',
      text: '',
    },
    buttons: [],
  }
})

export const useTemplateStore = defineStore('template', {
  state: (): { template: TemplateState } => {
    return initState()
  },
  getters: {
    buttonsByCategory: (state) => {
      return state.template.buttons.reduce((acc, item) => {
        acc[item.category] = acc[item.category] || []
        acc[item.category].push(item)
        return acc
      }, {} as TemplateButtonsByCategory)
    },
    variableKeys: (state): string[] => {
      return Object.keys(state.template.body.variables)
    },
    buttonsFilled: (state): boolean => {
      const incompleteBtn = state.template.buttons.find(b => {
        switch(b.type) {
          case 'STATIC_URL': {
            const urlBtn = b as TemplateUrlBtn
            return !urlBtn.text || !urlBtn.url 
          }
          case 'DYNAMIC_URL': {
            const urlBtn = b as TemplateUrlBtn
            return !urlBtn.text || !urlBtn.url || !urlBtn.example
          }
          case 'PHONE_NUMBER': {
            const phoneBtn = b as TemplateCallBtn
            return !phoneBtn.text || !phoneBtn.phone_number || !phoneBtn.phone_number_prefix
          }
          case 'QUICK_REPLY': {
            return !b.text
          }
          default: return false
        }
      })

      return !incompleteBtn
    }
  },
  actions: {
    clearState() {
      this.$state = initState()
    },
    updateButtons() {
      this.template.buttons = Object.values(this.buttonsByCategory).flat()
    },
    switchCategoryOrder(category: string) {
      const categories = Object.keys(this.buttonsByCategory)
      const index = categories.indexOf(category)

      if (index === -1) return

      const nextIndex = (index + 1) % categories.length

      const newOrder = [...categories]
      const temp = newOrder[index]
      newOrder[index] = newOrder[nextIndex]
      newOrder[nextIndex] = temp

      this.template.buttons = newOrder.map((cat) => this.buttonsByCategory[cat]).flat()
    },
  },
})
