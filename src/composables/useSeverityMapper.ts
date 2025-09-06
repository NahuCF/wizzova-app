import type { BroadcastStatus, PrimeVueSeverity } from "~/types"

export const useSeverityMapper = () => {
	const broadcastSeverity = (status: BroadcastStatus): PrimeVueSeverity => {
		const map: Record<BroadcastStatus, PrimeVueSeverity> = {
			queued: 'secondary',
			scheduled: 'info',
			sending: 'warn',
			sent: 'success',
			cancelled: 'danger',
			failed: 'danger'
		}

		return map[status]
	}

	return {
		broadcastSeverity
	}
}