import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { API } from "~/services"
import type { ContactFieldItem } from "~/types"

export const useContactFieldStore = defineStore('contactField', () => {
    const contactFields = ref<ContactFieldItem[]>([])
    const loading = ref(false)

    const fetchContactFields = async () => {
        if (loading.value) return

        loading.value = true
        try {
            const response = await API.contactField.index(1, 100)
            contactFields.value = response.data.data
        } catch (error) {
            console.error('Failed to fetch contact fields:', error)
        } finally {
            loading.value = false
        }
    }

    const primaryFields = computed(() =>
        contactFields.value.filter(field => field.is_primary_field)
    )

    const requiredFields = computed(() =>
        contactFields.value.filter(field => field.is_mandatory)
    )

    return {
        contactFields,
        primaryFields,
        requiredFields,
        loading,
        fetchContactFields
    }
})