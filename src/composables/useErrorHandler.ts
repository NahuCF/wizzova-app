import axios from "axios"
import { useToast } from "primevue"
import { useI18n } from "vue-i18n"

export const useErrorHandler = () => {
	const toast = useToast()
	const { t } = useI18n()

	const handleError = (error: unknown) => {
		if (axios.isAxiosError(error)) {
			if (error.code === 'PROFILE_INCOMPLETE') {
				return
			}

			if (error.response?.status === 422 && error.response.data) {
				const errorKey = error.response.data.message?.replace('.', '')
				const message = t(`validation_errors.${errorKey}`)
				toast.add({
					severity: 'error',
					summary: 'Error',
					detail: message,
					life: 3000,
				})
				return
			}
		}

		toast.add({
			severity: 'error',
			summary: 'Error',
			detail: t('an_error_occurred'),
			life: 3000,
		})
	}

	return handleError
}