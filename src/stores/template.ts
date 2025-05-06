import { defineStore } from 'pinia'

export const useTemplateStore = defineStore('template', {
  state: () => {
    return {
      template: {
        name: '',
        languageId: 0,
        templateCategoryId: 0,
        allowCategoryChange: false,
        constainsHeader: false,
        footer: {
          text: '',
        },
        body: {
          text: '',
        },
        header: {
          typeId: 0,
          text: '',
        },
        buttons: [],
      },
    }
  },
  getters: {
    buttonsByCategory: (state) => {
      return state.template.buttons.reduce((acc, item) => {
        acc[item.category] = acc[item.category] || []
        acc[item.category].push(item)
        return acc
      }, {})
    },
  },
  actions: {
    updateButtons() {
      this.template.buttons = Object.values(this.buttonsByCategory).flat()
    },
    switchCategoryOrder(category) {
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
