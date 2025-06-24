import { defineStore } from 'pinia'
import type { TemplateState, TemplateButtonsByCategory, TemplateUrlBtn, TemplateCallBtn } from '~/types'

export const useTemplateStore = defineStore('template', {
  state: () => {
    return {
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
      } as TemplateState,
    }
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
          case 'URL': {
            const urlBtn = b as TemplateUrlBtn
            return !urlBtn.text || !urlBtn.url 
          }
          case 'PHONE_NUMBER': {
            const phoneBtn = b as TemplateCallBtn
            return !phoneBtn.text || !phoneBtn.phone_number
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
