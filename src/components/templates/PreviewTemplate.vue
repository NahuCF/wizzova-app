<script setup lang="ts">
import {
  IconArrowLeft,
  IconDotsVertical,
  IconMicrophoneFilled,
  IconPaperclip,
  IconCamera,
  IconMoodHappy,
  IconBrandWhatsappFilled,
  IconRosetteDiscountCheckFilled,
} from '@tabler/icons-vue'
import MessagePreview from '~/components/templates/MessagePreview.vue'
import { useTemplateStore } from '~/stores'

const templateStore = useTemplateStore()
</script>

<template>
  <div class="border border-slate-200 flex flex-col w-[23rem] preview rounded-lg overflow-hidden">
    <div class="bg-[#00A884] h-[3rem] flex justify-between items-center px-3">
      <div class="flex gap-2 items-center">
        <IconArrowLeft color="white" size="18" />
        <div class="relative">
          <div class="relative z-[300]">
            <IconBrandWhatsappFilled size="20" class="icon-whatsapp" color="#25D366" />
          </div>
          <div class="w-3 h-3 bg-white absolute left-[.3rem] top-1 z-[200]"></div>
        </div>
        <span class="text-white">Business</span>
        <div class="relative">
          <div class="relative z-[300]">
            <IconRosetteDiscountCheckFilled color="#25D366" size="18" />
          </div>
          <div class="w-2 h-2 bg-white absolute left-1.5 top-2 z-[200]"></div>
        </div>
      </div>
      <IconDotsVertical color="white" size="18" />
    </div>

    <div class="p-5 flex h-[30rem] overflow-y-scroll">
      <MessagePreview
        :header="''"
        :body="templateStore.template.body"
        :footer="templateStore.template.footer"
        :buttons="templateStore.template.buttons"
      />
    </div>

    <div class="mt-auto flex gap-2 w-full p-3 h-[4.3rem]">
      <div class="rounded-full bg-white shadow flex items-center gap-3 p-1 px-3 grow">
        <div class="flex gap-2 grow items-center">
          <IconMoodHappy size="20" color="#606060" />
          <span class="text-slate-400"> Message </span>
        </div>
        <IconPaperclip size="18" color="#606060" />
        <IconCamera size="18" color="#606060" />
      </div>
      <div
        class="rounded-full bg-[#00A884] shadow-lg w-[2.8rem] h-[2.8rem] flex items-center justify-center"
      >
        <IconMicrophoneFilled size="18" color="white" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview {
  background-image: url('/images/pattern.png');
  background-size: 366.5px 666px;
  background-color: #f6f1ec;
  background-position: center;
}
.message {
  z-index: 100;
}
.icon-whatsapp {
  stroke: white;
  stroke-width: 1;
}
</style>
