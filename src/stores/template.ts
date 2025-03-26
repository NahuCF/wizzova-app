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
})
