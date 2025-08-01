import { ref, type Ref } from 'vue'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'

interface CrudApi<T> {
    create: (data: T) => Promise<any>
    update: (data: T) => Promise<any>
    delete: (id: string) => Promise<any>
}

interface UseCrudActionsOptions<T> {
    api: CrudApi<T>
    fetchData: () => void
    i18nKeys: {
        created: string
        updated: string
        deleted: string
    }
}

export function useCrudActions<T extends { id?: string | number }>(
    options: UseCrudActionsOptions<T>
) {
    const loading = ref(false)
    const toast = useToast()
    const { t } = useI18n()

    const showSuccess = (key: string) => {
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: t(key),
            life: 3000,
        })
    }

    const showError = (error: unknown) => {
        let message = t('an_error_occurred')

        if (axios.isAxiosError(error) && error.status === 422 && error.response) {
            const errorKey = error.response.data.message?.replace('.', '')
            message = t(`validation_errors.${errorKey}`)
        }

        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
            life: 3000,
        })
    }

    const createOrUpdate = async (
        item: T,
        opts?: { onSuccess?: () => void }
    ) => {
        loading.value = true
        try {
            if (item.id) {
                await options.api.update(item)
                showSuccess(options.i18nKeys.updated)
            } else {
                await options.api.create(item)
                showSuccess(options.i18nKeys.created)
            }

            options.fetchData()
            opts?.onSuccess?.()
        } catch (error) {
            showError(error)
        } finally {
            loading.value = false
        }
    }

    const remove = async (
        id: string,
        opts?: { onSuccess?: () => void }
    ) => {
        try {
            await options.api.delete(id)
            options.fetchData()
            showSuccess(options.i18nKeys.deleted)
            opts?.onSuccess?.()
        } catch (error) {
            showError(error)
        }
    }

    return {
        loading,
        createOrUpdate,
        remove,
    }
}
