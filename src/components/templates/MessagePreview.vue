<script setup lang="ts">
import { defineProps, computed, type Component } from 'vue'
import { IconExternalLink, IconPhone, IconArrowBackUp, IconList } from '@tabler/icons-vue'
import type { TemplateBtn, TemplateBtnType, TemplateCallBtn, TemplateUrlBtn } from '~/types'

const props = withDefaults(
  defineProps<{
    header: string,
    body: string,
    footer?: string,
    buttons: (TemplateBtn | TemplateUrlBtn | TemplateCallBtn)[],
    minWidth?: string,
    maxWidth?: string
  }>(), 
  {
    footer: ''
  }
)

const formattedBodyText = computed(() => {
  if (!props.body) {
    return ''
  }

  // Hightlight variables
  let formatedText = props.body.replace(/{{\s*(\w+)\s*}}/g, (_match, variableName) => {
    return `<mark class='px-1 bg-slate-100 text-green-700 font-semibold'>${variableName}</mark>`
  })

  formatedText = formatedText.replace(/\*(.*?)\*/g, (_match, value) => {
    return `<b>${value}</b>`
  })

  formatedText = formatedText.replace(/_(.*?)_/g, (_match, value) => {
    return `<em>${value}</em>`
  })

  formatedText = formatedText.replace(/\~(.*?)\~/g, (_match, value) => {
    return `<s>${value}</s>`
  })

  // Add html tags for new line characters
  formatedText = formatedText.replace(/\n/g, '<br>')

  return formatedText
})

const filteredButtons = computed(() => {
  const buttons = props.buttons.filter(b => b.text)

  if (buttons.length <= 3) {
    return buttons
  }

  const firstTwo = buttons.slice(0, 2)
  const showMoreButton: TemplateBtn = {
    type: 'EXPLORE_MORE',
    category: 'explore_more',
    text: 'Explore more'
  }

  return [...firstTwo, showMoreButton]
})

const iconComponents: Record<TemplateBtnType, Component> = {
  STATIC_URL: IconExternalLink,
  DYNAMIC_URL: IconExternalLink,
  PHONE_NUMBER: IconPhone,
  QUICK_REPLY: IconArrowBackUp,
  EXPLORE_MORE: IconList
}
</script>

<template>
  <div
    v-if="body.length || (body.length > 0 && footer.length) || (header.length && header.length > 0)"
    class="flex flex-col gap-2.5 bg-white px-3 pt-2 pb-1 message rounded-lg self-start break-all relative shadow "
    :class="`${minWidth ?? 'min-w-[18rem]'} ${maxWidth ?? 'max-w-[100%]'}`"
  >
    <div v-if="header.length > 0" class="font-semibold">
      {{ header }}
    </div>

    <span class="font-regular" v-if="body.length > 0" v-html="formattedBodyText"></span>

    <div class="text-slate-400 text-sm italic" v-if="body.length > 0 && footer.length > 0">
      {{ footer }}
    </div>
    <div class="triangle"></div>

    <div class="flex flex-col items-center">
      <button v-for="(button, index) in filteredButtons" :key="button.type + index"
        class="w-full flex justify-center items-center gap-2 pt-3 pb-2 text-sm font-light text-sky-600 border-t-1 border-slate-100">
          <component
            :is="iconComponents[button.type]"
            class="w-[13px] h-[13px]"
          />
          {{ button.text }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.triangle {
  position: absolute;
  z-index: -10;
  top: 0.7rem;
  left: -4px;
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 20px solid white; /* Match the chat bubble background color */
  transform: translate(-10px, -10px); /* Adjust positioning */
}
</style>
