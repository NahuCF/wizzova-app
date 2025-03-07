import { defineStore } from 'pinia'

export const useProfileCreationStore = defineStore('profileCreation', {
  state: () => {
    return {
      progress: 0,
      steps: 4,
      currentStep: 0,
    }

    // 1 signup
    // 2 verify account
    // 3 basic information
    // 4 verify whatsapp
  },
  actions: {
    incrementProgress(step: number) {
      let percentage = 100 / this.steps
      this.progress = step * percentage
    },
  },
  persist: true,
})
