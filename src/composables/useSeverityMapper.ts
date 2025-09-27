import type { BroadcastStatus, PrimeVueSeverity } from "~/types"
import type { BotStatus } from "~/types/Bot"

export const useSeverityMapper = () => {
	const broadcastSeverity = (status: BroadcastStatus): PrimeVueSeverity => {
		const map: Record<BroadcastStatus, PrimeVueSeverity> = {
			queued: 'secondary',
			scheduled: 'info',
			sending: 'warn',
			sent: 'success',
			cancelled: 'danger',
			failed: 'danger',
			completed: 'success'
		}

		return map[status]
	}

	const botSeverity = (status: BotStatus): PrimeVueSeverity => {
		const map: Record<BotStatus, PrimeVueSeverity> = {
			draft: "info",
			active: "success",
			archived: "secondary"
		}

		return map[status]
	}

	return {
		broadcastSeverity,
		botSeverity
	}
}