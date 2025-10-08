import { computed, ref } from 'vue'
import type { DataTablePageEvent } from 'primevue'
import { useDebounceFn } from '~/composables/useDebounceFn'
import type { Page } from '~/types'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from './useErrorHandler'

export function usePaginatedData<T, PageType extends Page<T> = Page<T>>(
	fetchFn: (page: number, perPage: number, searchTerm: string) => Promise<any>,
	perPageDefault = 10
) {
	const { t } = useI18n()
	const handleError = useErrorHandler()

	const dataPage = ref<PageType>({
		data: [],
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
	} as unknown as PageType)

	const loading = ref(false)
	const searchTerm = ref('')
	const rowsPerPage = ref(perPageDefault)

	const isLastPage = computed(() => 
		dataPage.value.meta && dataPage.value.meta.current_page === dataPage.value.meta.last_page)

	const fetchDataPage = async (page = 1, perPage = rowsPerPage.value, append = false) => {
		loading.value = true
		try {
			if (!append) dataPage.value.data = []
			const response = await fetchFn(page, perPage, searchTerm.value)
			if (append) {
				dataPage.value.data = [
					...dataPage.value.data,
					...response.data
				]
				dataPage.value.meta = response.meta
				dataPage.value.links = response.links
			} else {
				dataPage.value = response
			}
		} catch(error) {
			handleError(error)
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

	const onPage = ({ rows, first }: DataTablePageEvent) => {
		rowsPerPage.value = rows
		const page = Math.floor(first / rows) + 1
		fetchDataPage(page, rowsPerPage.value)
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
		isLastPage,
		fetchDataPage,
		loadNextPage,
		debouncedFetch,
		onPage
	}
}
