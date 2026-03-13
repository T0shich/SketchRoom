export const normalizeRoomKey = (roomKey?: string) => {
	if (typeof roomKey !== 'string') return null
	const normalized = roomKey.trim().toUpperCase()
	return normalized.length ? normalized : null
}