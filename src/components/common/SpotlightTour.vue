<script setup lang="ts">
import { ref, computed, onMounted, watch, type CSSProperties, nextTick } from 'vue'
import { IconX } from '@tabler/icons-vue'

export interface Step {
  target?: HTMLElement
  text: string
  position?: 'top' | 'right' | 'bottom' | 'left'
  highlight?: boolean
  borderColor?: string
}

interface Props {
  steps: Step[]
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), { visible: false })
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'finish'): void
}>()

const currentStepIndex = ref(0)
const rect = ref<DOMRect | null>(null)
const elementSize = ref({ width: 0, height: 0 })
const tooltipSize = ref({ width: 0, height: 0 })
const tooltipEl = ref<HTMLElement | null>(null)
const originalZIndices = new Map<HTMLElement, string | null>()
const enablePositionTransition = ref(false)

const currentStep = computed(() => props.steps[currentStepIndex.value] ?? null)
const currentEl = computed(() => currentStep.value?.target)

const highlightStyle = computed<CSSProperties>(() => {
  if (!rect.value) return {}

  return {
    top: `${rect.value.top}px`,
    left: `${rect.value.left}px`,
    width: `${elementSize.value.width}px`,
    height: `${elementSize.value.height}px`,
    boxShadow: currentStep.value?.highlight ? 'rgba(33,33,33,0.5) 0 0 0 5000px' : 'none',
  }
})

const tooltipStyle = computed<CSSProperties>(() => {
  if (!currentStep.value) return {}

  const spacing = 12

  if (rect.value) {
    const { top, bottom, left, right } = rect.value
    const { width, height } = tooltipSize.value

    switch (currentStep.value.position) {
      case 'top':
        return { top: `${top - height - spacing}px`, left: `${left}px` }
      case 'right':
        return { top: `${top}px`, left: `${right + spacing}px` }
      case 'left':
        return { top: `${top}px`, left: `${left - width - spacing}px` }
      default:
        return { top: `${bottom + spacing}px`, left: `${left}px` }
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight

  return {
    top: `${(vh - tooltipSize.value.height) / 2}px`,
    left: `${(vw - tooltipSize.value.width) / 2}px`,
  }
})

const updatePosition = () => {
  const el = currentEl.value

  if (el) {
    rect.value = el.getBoundingClientRect()
    elementSize.value = { width: el.offsetWidth, height: el.offsetHeight }

    if (!originalZIndices.has(el)) originalZIndices.set(el, el.style.zIndex)
    el.style.zIndex = '201'
  } else {
    rect.value = null
  }

  if (tooltipEl.value) {
    tooltipSize.value = {
      width: tooltipEl.value.offsetWidth,
      height: tooltipEl.value.offsetHeight,
    }
  }
}

const resetZIndex = (el?: HTMLElement) => {
  if (!el) return

  const original = originalZIndices.get(el)
  if (original !== undefined) {
    el.style.zIndex = original || ''
    originalZIndices.delete(el)
  }
}

const nextStep = () => {
  resetZIndex(currentEl.value)

  if (currentStepIndex.value < props.steps.length - 1) currentStepIndex.value++
  else emit('finish')
}

const prevStep = () => {
  resetZIndex(currentEl.value)

  if (currentStepIndex.value > 0) currentStepIndex.value--
}

const closeTour = () => {
  resetZIndex(currentEl.value)
  emit('close')
}

onMounted(() => {
  if (props.visible) updatePosition()
  window.addEventListener('resize', updatePosition)
})

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      enablePositionTransition.value = false

      await nextTick()
      updatePosition()
      enablePositionTransition.value = true
    } else {
      rect.value = null
      elementSize.value = { width: 0, height: 0 }
      tooltipSize.value = { width: 0, height: 0 }
      currentStepIndex.value = 0
    }
  },
)

watch(currentStep, async () => {
  await nextTick()
  resetZIndex()
  updatePosition()
})
</script>

<template>
  <div v-show="visible" :class="currentStep.highlight ? 'fixed inset-0 z-[200]' : ''">
    <!-- Highlight box -->
    <div
      v-if="rect && currentStep.highlight"
      :class="[
        'absolute border-radius highlight-box',
        currentStep?.borderColor ?? 'outline-2 outline-emerald-500!',
      ]"
      :style="highlightStyle"
    ></div>

    <!-- Spotlight overlay -->
    <div
      v-if="currentStep.highlight"
      class="spotlight-overlay"
      :style="{ backgroundColor: rect ? 'transparent' : 'rgba(0,0,0,0.5)' }"
    ></div>

    <!-- Tooltip -->
    <teleport to="body">
      <transition name="fade-scale">
        <div
          v-if="currentStep && visible"
          v-show="visible"
          ref="tooltipEl"
          class="tooltip-wrapper absolute min-w-[200px] max-w-[320px] z-[9999] rounded-xl"
          :class="{ 'tooltip-transition': enablePositionTransition }"
          :style="tooltipStyle"
        >
          <div
            v-if="currentEl"
            class="absolute"
            :class="{
              'top-arrow': currentStep.position === 'top',
              'bottom-arrow': !currentStep.position || currentStep.position === 'bottom',
              'left-arrow': currentStep.position === 'left',
              'right-arrow': currentStep.position === 'right',
            }"
          ></div>

          <div class="tooltip-box relative p-4 rounded-xl bg-white">
            <div class="flex justify-end">
              <button class="cursor-pointer text-gray-500 hover:text-gray-800" @click="closeTour">
                <IconX size="18" />
              </button>
            </div>

            <div class="flex justify-between items-start gap-2 p-6">
              <div class="spotlight-content text-gray-800">
                {{ currentStep.text }}
              </div>
            </div>

            <div class="text-center text-sm">{{ currentStepIndex + 1 }} / {{ steps.length }}</div>

            <div class="spotlight-actions flex justify-between mt-4">
              <div v-if="currentStepIndex === 0"></div>

              <Button
                v-if="currentStepIndex > 0"
                class="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                severity="secondary"
                @click="prevStep"
              >
                {{ $t('back') }}
              </Button>

              <Button v-if="currentStepIndex < steps.length - 1" severity="info" @click="nextStep">
                {{ $t('next') }}
              </Button>

              <Button v-else @click="emit('finish')">{{ $t('complete') }}</Button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.highlight-box {
  position: absolute;
  border-radius: 6px;
  box-sizing: content-box;
  transition: all 0.3s ease;
  z-index: 201;
}

.tooltip-wrapper {
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.24));
}

.tooltip-transition {
  transition:
    top 0.3s ease,
    left 0.3s ease;
}

.spotlight-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
}

.top-arrow {
  position: absolute;
  bottom: -5px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.24));
}

.bottom-arrow {
  position: absolute;
  top: -5px;
  left: 20px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.24));
}

.left-arrow {
  position: absolute;
  right: -5px;
  top: 10px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid white;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.24));
}

.right-arrow {
  position: absolute;
  left: -5px;
  top: 10px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid white;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.24));
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
  transform-origin: top left;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
