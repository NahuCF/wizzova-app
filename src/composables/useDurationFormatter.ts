export const useDurationFormatter = () => {
  const formatDuration = (totalMinutes: number | null): string => {
    if (totalMinutes === null) return '-'
    const h = Math.floor(totalMinutes / 60)
    const m = Math.round(totalMinutes % 60)
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
  }

  const formatMinutes = (minutes: number | null): string => formatDuration(minutes)

  const formatHours = (hours: number | null): string =>
    formatDuration(hours !== null ? hours * 60 : null)

  return {
    formatDuration,
    formatMinutes,
    formatHours,
  }
}
