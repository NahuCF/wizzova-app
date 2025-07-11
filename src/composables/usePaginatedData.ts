import { computed, ref } from 'vue'
import { useToast } from 'primevue'
import { useDebounceFn } from '~/composables/useDebounceFn'
import type { Page } from '~/types'
import { useI18n } from 'vue-i18n'

export function usePaginatedData<T>(
	fetchFn: (page: number, perPage: number, searchTerm: string) => Promise<any>,
	perPageDefault = 10,
) {
	const { t } = useI18n()
	const toast = useToast()

	const dataPage = ref<Page<T>>({
		data: [] as T[],
		meta: {
			current_page: 1, 
			last_page: 1, 
			total: 0, 
			links: [],
			from: 0,
			path: '',
			per_page: 0,
			to: 0
		},
		links: {
			first: null,
			last: null,
			prev: null,
			next: null
		},
	})
	const loading = ref(false)
	const searchTerm = ref('')
	const rowsPerPage = ref(perPageDefault)

	const fetchDataPage = async (page = 1, perPage = rowsPerPage.value, append = false) => {
		loading.value = true
		try {
			if (!append) dataPage.value.data = []
			const response = await fetchFn(page, perPage, searchTerm.value)
			if (append) {
				dataPage.value.data.push(...response.data)
				dataPage.value.meta = response.meta
				dataPage.value.links = response.links
			} else {
				dataPage.value = response
			}
		} catch {
			toast.add({ severity: 'error', summary: 'Error', detail: t('an_error_occurred'), life: 3000 })
		} finally {
			loading.value = false
		}
	}

	// For infinite scroll loading
	const loadNextPage = async () => {
		if (dataPage.value.meta.current_page < dataPage.value.meta.last_page && !loading.value) {
			await fetchDataPage(dataPage.value.meta.current_page + 1, rowsPerPage.value, true)
		}
	}

	const debouncedFetch = useDebounceFn(fetchDataPage, 500)

	const currentPageReport = computed(() => {
		const total = dataPage.value.meta.total
		const first = (dataPage.value.meta.current_page - 1) * rowsPerPage.value + (total > 0 ? 1 : 0)
		let last = first + rowsPerPage.value - 1
		if (last > dataPage.value.meta.total) last = dataPage.value.meta.total
		
		return t('showing_results', {
			first: first,
			last: last,
			totalRecords: total
		})
	})

	return {
		dataPage,
		loading,
		searchTerm,
		rowsPerPage,
		currentPageReport,
		fetchDataPage,
		loadNextPage,
		debouncedFetch,
	}
}
