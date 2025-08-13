import { ref } from 'vue'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'

interface CrudApi<T> {
    create?: (data: T) => Promise<any>
    update?: (data: T) => Promise<any>
    delete?: (id: string) => Promise<any>
}

interface UseCrudActionsOptions<T> {
    api: CrudApi<T>
    fetchData: () => void
    i18nKeys: {
        created?: string
        updated?: string
        deleted?: string
    }
}

export function useCrudActions<T extends { id?: string | number }>(
    options: UseCrudActionsOptions<T>
) {
    const loading = ref(false)
    const toast = useToast()
    const { t } = useI18n()
    const handleError = useErrorHandler()

    const showSuccess = (key: string) => {
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: t(key),
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
                if (!options.api.update) {
                    console.warn('Update operation is not available.')
                    return
                }

                await options.api.update(item)
                showSuccess(options.i18nKeys.updated || '')
            } else {
                if (!options.api.create) {
                    console.warn('Create operation is not available.')
                    return
                }

                await options.api.create(item)
                showSuccess(options.i18nKeys.created || '')
            }

            options.fetchData()
            opts?.onSuccess?.()
        } catch (error) {
            handleError(error)
        } finally {
            loading.value = false
        }
    }

    const remove = async (
        id: string,
        opts?: { onSuccess?: () => void }
    ) => {
        if (!options.api.delete) {
            console.warn('Delete operation is not available.')
            return
        }

        try {
            await options.api.delete(id)
            options.fetchData()
            showSuccess(options.i18nKeys.deleted || '')
            opts?.onSuccess?.()
        } catch (error) {
            handleError(error)
        }
    }

    return {
        loading,
        createOrUpdate,
        remove,
    }
}
