<template>
  <div
    v-if="body.length || (body.length > 0 && footer.length)"
    class="bg-white p-3 message rounded-lg self-start break-all relative shadow min-w-[18rem]"
  >
    <span v-if="body.length > 0" v-html="formattedBodyText"></span>

    <div class="text-slate-400 text-sm mt-2" v-if="body.length > 0">
      {{ footer }}
    </div>
    <div class="triangle"></div>
    <Divider v-if="true" />
    {{ buttons }}
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  body: {
    type: String,
    required: true,
  },
  footer: {
    type: String,
    required: false,
    default: '',
  },
  buttons: {
    type: Array,
    required: false,
  },
})

const formattedBodyText = computed(() => {
  if (!props.body) {
    return ''
  }
  return props.body.replace(/\n/g, '<br>')
})
</script>
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
