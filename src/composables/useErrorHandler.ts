import axios from "axios"
import { useToast } from "primevue"
import { useI18n } from "vue-i18n"

export const useErrorHandler = () => {
	const toast = useToast()
	const { t, te } = useI18n()

	const handleError = (error: unknown) => {
		if (axios.isAxiosError(error)) {
			if (error.code === 'PROFILE_INCOMPLETE') {
				console.log(error)
				return
			}

			if (error.response?.status === 422 && error.response.data) {
				const errorKey = error.response.data.message_code || error.response.data.message?.replace('.', '')
				const messageExists = te(`validation_errors.${errorKey}`)
				const message = messageExists ? t(`validation_errors.${errorKey}`) : t('an_error_occurred')

				toast.add({
					severity: 'error',
					summary: 'Error',
					detail: message,
					life: 1000000,
				})
				return
			}
			else if (error.response?.status === 400 && error.response.data) {
				const title = error.response.data.message
				const message = error.response.data.error

				toast.add({
					severity: 'error',
					summary: title ?? 'Error',
					detail: message ?? t('an_error_occurred'),
					life: 1000000,
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