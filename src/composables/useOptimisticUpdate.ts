import { ref } from 'vue'

type UpdateKey = string
type UpdateType = string

interface OptimisticOptions<T> {
  key: UpdateKey
  type: UpdateType
  applyOptimistic: () => T
  rollback?: () => T
  apiCall: () => Promise<T>
}

export const useOptimisticUpdate = () => {
  const pendingUpdates = ref<Map<UpdateKey, Set<UpdateType>>>(new Map())

  const optimisticUpdate = async <T>(options: OptimisticOptions<T>): Promise<T | undefined> => {
    const { key, type, applyOptimistic, rollback, apiCall } = options
    const keyPending = pendingUpdates.value.get(key) || new Set()
    if (keyPending.has(type)) return undefined
    keyPending.add(type)
    pendingUpdates.value.set(key, keyPending)
    const optimisticResult = applyOptimistic()
    try {
      const result = await apiCall()
      return result
    } catch (e) {
      rollback?.()
    } finally {
      keyPending.delete(type)
      if (keyPending.size === 0) pendingUpdates.value.delete(key)
    }
  }

  return { optimisticUpdate }
}
