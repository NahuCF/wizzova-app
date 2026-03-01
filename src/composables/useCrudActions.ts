import { ref } from 'vue'
import { useToast } from 'primevue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'
import type { AxiosResponse } from 'axios'

interface CrudApi<Req, Res = unknown> {
  create?: (data: Req) => Promise<AxiosResponse<Res>>
  update?: (data: Req) => Promise<AxiosResponse<Res>>
  delete?: (id: string) => Promise<any>
}

interface UseCrudActionsOptions<Req, Res> {
  api: CrudApi<Req, Res>
  fetchData: () => void
  i18nKeys: {
    created?: string
    updated?: string
    deleted?: string
  }
}

export function useCrudActions<Req extends { id?: string | number }, Res = unknown>(
  options: UseCrudActionsOptions<Req, Res>,
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
    item: Req,
    opts?: { onSuccess?: (response?: Res) => void; onError?: (e: unknown) => void },
  ) => {
    loading.value = true
    try {
      let response

      if (item.id) {
        if (!options.api.update) {
          console.warn('Update operation is not available.')
          return
        }

        response = await options.api.update(item)
        showSuccess(options.i18nKeys.updated || '')
      } else {
        if (!options.api.create) {
          console.warn('Create operation is not available.')
          return
        }

        response = await options.api.create(item)
        showSuccess(options.i18nKeys.created || '')
      }

      options.fetchData()
      opts?.onSuccess?.(response.data)
    } catch (error) {
      if (opts?.onError) {
        opts?.onError(error)
      } else {
        handleError(error)
      }
    } finally {
      loading.value = false
    }
  }

  const remove = async (
    id: string,
    opts?: { onSuccess?: () => void; onError?: (e: unknown) => void },
  ) => {
    if (!options.api.delete) {
      console.warn('Delete operation is not available.')
      return
    }

    loading.value = true
    try {
      await options.api.delete(id)
      options.fetchData()
      showSuccess(options.i18nKeys.deleted || '')
      opts?.onSuccess?.()
    } catch (error) {
      if (opts?.onError) {
        opts?.onError(error)
      } else {
        handleError(error)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    createOrUpdate,
    remove,
  }
}
