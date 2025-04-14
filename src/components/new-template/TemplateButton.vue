<template>
  <div class="bg-white border border-slate-200 rounded-md p-4">
    <div v-if="type == 'QUICK_REPLY'">
      <div class="text-slate-500 text-sm mb-1">
        {{ t('new_template.buttons.quick_reply.description') }}
      </div>
      <div class="flex w-full gap-4 items-center">
        <div class="relative w-full">
          <InputText
            v-model="templateStore.buttonsByCategory[category][index].text"
            :placeholder="t('new_template.buttons.quick_reply.placeholder')"
            class="!pr-[5.5rem]"
            :maxlength="25"
            fluid
          />
          <div class="absolute right-3 top-2 text-slate-400">
            {{ templateStore.buttonsByCategory[category][index].text?.length ?? 0 }} / 25
          </div>
        </div>
        <button
          class="p-2 hover:cursor-pointer hover:bg-red-50 transition rounded-md"
          @click="removeButton"
        >
          <IconTrash class="text-red-400 w-5 h-5" />
        </button>
      </div>
    </div>
    <div v-else-if="type == 'URL'">
      <div class="flex justify-between">
        <Select
          :options="urlOptions"
          option-label="name"
          option-value="id"
          class="!w-[14.5rem]"
          v-model="templateStore.buttonsByCategory[category][index].type_url"
        >
        </Select>
        <button
          class="p-2 hover:cursor-pointer hover:bg-red-50 transition rounded-md"
          @click="removeButton"
        >
          <IconTrash class="text-red-400 w-5 h-5" />
        </button>
      </div>
      <div class="flex gap-3 mt-4">
        <div class="flex gap-4">
          <div class="!w-[25rem]">
            <div class="text-slate-500 text-sm mb-1">
              {{ t('new_template.button_text') }}
            </div>
            <div class="relative">
              <InputText
                v-model="templateStore.buttonsByCategory[category][index].text"
                :placeholder="t('new_template.buttons.url.placeholder_text')"
                class="!pr-[5.5rem]"
                :maxlength="25"
                fluid
              />
              <div class="absolute right-3 top-2 text-slate-400">
                {{ templateStore.buttonsByCategory[category][index].text?.length ?? 0 }} / 25
              </div>
            </div>
          </div>

          <div class="w-full">
            <div class="text-slate-500 text-sm mb-1">
              {{ t('new_template.buttons.url.label') }}
            </div>
            <div class="relative">
              <InputText
                v-model="templateStore.buttonsByCategory[category][index].url"
                :placeholder="t('new_template.buttons.url.placeholder_url')"
                class="!pr-[5.5rem]"
                :maxlength="2000"
                fluid
              />
              <div class="absolute right-3 top-2 text-slate-400">
                {{ templateStore.buttonsByCategory[category][index].url?.length ?? 0 }} / 2000
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="mt-5"
        v-if="templateStore.buttonsByCategory[category][index].type_url == 'dynamic_url'"
      >
        <div class="text-slate-500 text-sm mb-1">
          {{ t('new_template.buttons.url.example_label') }}
        </div>
        <div class="relative">
          <InputText
            v-model="templateStore.buttonsByCategory[category][index].example"
            :placeholder="t('new_template.buttons.url.example_placeholder')"
            class="!pr-[5.5rem]"
            :maxlength="25"
            fluid
          />
          <div class="absolute right-3 top-2 text-slate-400">
            {{ templateStore.buttonsByCategory[category][index].example?.length ?? 0 }} / 2000
          </div>
        </div>
        <p class="mt-5 text-slate-400 text-sm">
          {{ t('new_template.buttons.url.example_description') }}
        </p>
      </div>
    </div>
    <div v-else-if="type == 'PHONE_NUMBER'">
      <div class="text-slate-500 text-sm mb-1 flex items-center justify-between">
        {{ t('new_template.buttons.phone_number.title') }}
        <button
          class="p-2 hover:cursor-pointer hover:bg-red-50 transition rounded-md"
          @click="removeButton"
        >
          <IconTrash class="text-red-400 w-5 h-5" />
        </button>
      </div>
      <div class="flex gap-4 mt-4">
        <div class="!w-[25rem]">
          <div class="text-slate-500 text-sm mb-1 flex items-center justify-between">
            {{ t('new_template.button_text') }}
          </div>
          <div class="relative">
            <InputText
              v-model="templateStore.buttonsByCategory[category][index].text"
              :placeholder="t('new_template.buttons.phone_number.placeholder')"
              class="!pr-[5.5rem]"
              :maxlength="25"
              fluid
            />
            <div class="absolute right-3 top-2 text-slate-400">
              {{ templateStore.buttonsByCategory[category][index].text?.length ?? 0 }} / 25
            </div>
          </div>
        </div>
        <div class="w-full">
          <div class="text-slate-500 text-sm mb-1 flex items-center justify-between">
            {{ t('new_template.buttons.phone_number.label') }}
          </div>
          <div class="flex gap-2 relative">
            <div
              @click="cellphonePopover.toggle($event)"
              class="flex items-center border border-slate-300 rounded-md p-2 hover:cursor-pointer"
            >
              <img
                :alt="`Country flag selected imagen ${selectedCountry}`"
                src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
                :class="`flag flag-${selectedCountry.toLowerCase()} w-8`"
              />
            </div>
            <InputGroup>
              <InputGroupAddon>{{ getSelectedCountry.prefix }}</InputGroupAddon>
              <InputText
                name="cellphone"
                id="cellphone"
                class="!pr-[5.5rem]"
                :maxlength="20"
                v-model="templateStore.buttonsByCategory[category][index].phone_number"
              />
            </InputGroup>

            <div class="absolute right-3 top-2 text-slate-400 z-20">
              {{ templateStore.buttonsByCategory[category][index]?.phone_number?.length ?? 0 }} / 20
            </div>
          </div>
        </div>
      </div>
    </div>

    <Popover ref="cellphonePopover" class="!p-0">
      <div class="flex flex-col">
        <div
          v-for="country in countries"
          @click="selectCountry(country)"
          :key="country.code"
          class="flex gap-2 items-center hover:bg-slate-100 py-2 px-3 hover:cursor-pointer"
        >
          <img
            src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png"
            :alt="`Country flag imagen ${country.name}`"
            :class="`flag flag-${country.code.toLowerCase()} !w-6`"
          />
          <span>{{ country.name }}</span>
        </div>
      </div>
    </Popover>
  </div>
</template>

<script setup>
import { computed, defineProps, ref } from 'vue'
import { IconTrash } from '@tabler/icons-vue'
import { useI18n } from 'vue-i18n'
import { useTemplateStore } from '~/stores'

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
})

const { t } = useI18n()
const templateStore = useTemplateStore()
const countries = ref([
  { name: 'Argentina', code: 'AR', prefix: '+54' },
  { name: 'Brazil', code: 'BR', prefix: '+55' },
  { name: 'Spain', code: 'ES', prefix: '+34' },
  { name: 'United States', code: 'US', prefix: '+1' },
])
const urlOptions = ref([
  {
    name: t('new_template.buttons.url.static_url'),
    id: 'static_url',
  },
  {
    name: t('new_template.buttons.url.dynamic_url'),
    id: 'dynamic_url',
  },
])
const cellphonePopover = ref()
const selectedCountry = ref('US')

const selectCountry = (country) => {
  selectedCountry.value = country.code
  cellphonePopover.value.hide()
}

const getSelectedCountry = computed(() => {
  return countries.value.find((country) => country.code === selectedCountry.value)
})

const removeButton = () => {
  templateStore.buttonsByCategory[props.category].splice(props.index, 1)
  templateStore.updateButtons()
}
</script>
