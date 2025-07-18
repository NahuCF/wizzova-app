import moment from 'moment/min/moment-with-locales'
import { useI18n } from 'vue-i18n'

export function useRelativeDateLabel() {
    const { t, locale } = useI18n()

    const capitalizeFirst = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    return (dateInput: string | Date, author?: string) => {
        moment.locale(locale.value)

        const date = moment(dateInput)
        const now = moment()

        let label = ''
        if (now.isSame(date, 'day')) {
            label = t('today')
        } else if (now.subtract(1, 'day').isSame(date, 'day')) {
            label = t('yesterday')
        } else {
            label = capitalizeFirst(date.fromNow())
        }

        const time = date.format('HH:mm')

        return {
            label,
            tooltip: {
                author: author ?? '',
                date: `${label} | ${time}`
            }
        }
    }
}
