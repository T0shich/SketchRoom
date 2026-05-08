import { Server } from 'socket.io'
import { rooms } from '../store/rooms'
import { CanvasClearPayload, CanvasObjectPayload } from '../types/Types'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

const MAX_EVENTS_PER_SECOND = {
	added: 20,
	modified: 60, 
	cleared: 5, 
	removed: 20,
}

type DrawLimitsRecord = {
	added: number[]
	modified: number[]
	cleared: number[]
	removed: number[]
}

const drawLimits = new Map<string, DrawLimitsRecord>()

const checkRateLimit = (
	socketId: string,
	eventType: keyof DrawLimitsRecord,
	maxPerSecond: number,
) => {
	if (!drawLimits.has(socketId)) {
		drawLimits.set(socketId, {
			added: [],
			modified: [],
			cleared: [],
			removed: [],
		})
	}

	const limits = drawLimits.get(socketId) as DrawLimitsRecord
	const now = Date.now()

	// Keep only timestamps from the last 1 second
	limits[eventType] = limits[eventType].filter(ts => now - ts < 1000)

	if (limits[eventType].length >= maxPerSecond) {
		return false
	}

	limits[eventType].push(now)
	return true
}

export function DrawHandler(io: Server) {
	io.on('connection', socket => {
		socket.on('object:added', (data: CanvasObjectPayload) => {
			const normalizedKey = normalizeRoomKey(data?.roomKey)
			if (!normalizedKey || !data?.object) return
			if (
				socket.data.roomKey !== normalizedKey ||
				!socket.rooms.has(normalizedKey)
			)
				return

			if (!checkRateLimit(socket.id, 'added', MAX_EVENTS_PER_SECOND.added)) {
				console.warn(
					`[SPAM PROTECTION] Socket ${socket.id} превысил лимит добавления объектов`,
				)
				socket.emit('error', {
					code: 'RATE_LIMIT_EXCEEDED',
					message: 'Слишком быстрые события добавления объектов',
				})
				return
			}
			if (!rooms.has(normalizedKey)) return

			const room = rooms.get(normalizedKey)
			if (room) {
				room.canvasObjects.push(data.object)
			}

			socket.to(normalizedKey).emit('object:added_s', { object: data.object })
		})

		socket.on('object:modified', (data: CanvasObjectPayload) => {
			const normalizedKey = normalizeRoomKey(data?.roomKey)
			if (!normalizedKey || !data?.object) return
			if (
				socket.data.roomKey !== normalizedKey ||
				!socket.rooms.has(normalizedKey)
			)
				return

			if (
				!checkRateLimit(socket.id, 'modified', MAX_EVENTS_PER_SECOND.modified)
			) {
				console.warn(
					`[SPAM PROTECTION] Socket ${socket.id} превысил лимит модификаций`,
				)
				socket.emit('error', {
					code: 'RATE_LIMIT_EXCEEDED',
					message: 'Слишком быстрые события модификации объектов',
				})
				return
			}
			if (!rooms.has(normalizedKey)) return

			const room = rooms.get(normalizedKey)
			if (room && data.object) {
				const objectData = data.object as Record<string, unknown>
				const objectId = objectData.socketObjectId
				const index = room.canvasObjects.findIndex((obj: unknown) => {
					const o = obj as Record<string, unknown>
					return o.socketObjectId === objectId
				})
				if (index !== -1) {
					room.canvasObjects[index] = data.object
				}
			}

			socket
				.to(normalizedKey)
				.emit('object:modified_s', { object: data.object })
		})

		socket.on('canvas:clear', (data: CanvasClearPayload) => {
			const normalizedKey = normalizeRoomKey(data?.roomKey)
			if (!normalizedKey) return
			if (
				socket.data.roomKey !== normalizedKey ||
				!socket.rooms.has(normalizedKey)
			)
				return

			if (
				!checkRateLimit(socket.id, 'cleared', MAX_EVENTS_PER_SECOND.cleared)
			) {
				console.warn(
					`[SPAM PROTECTION] Socket ${socket.id} превысил лимит очистки холста`,
				)
				socket.emit('error', {
					code: 'RATE_LIMIT_EXCEEDED',
					message: 'Слишком частые попытки очистки холста',
				})
				return
			}
			if (!rooms.has(normalizedKey)) return

			const room = rooms.get(normalizedKey)
			if (room) {
				room.canvasObjects = []
			}

			socket.to(normalizedKey).emit('canvas:clear_s')
		})

		socket.on(
			'object:removed',
			(data: { roomKey?: string; objectId?: string }) => {
				const normalizedKey = normalizeRoomKey(data?.roomKey)
				if (!normalizedKey || !data?.objectId) return
				if (
					socket.data.roomKey !== normalizedKey ||
					!socket.rooms.has(normalizedKey)
				)
					return
				if (!rooms.has(normalizedKey)) return

				if (
					!checkRateLimit(socket.id, 'removed', MAX_EVENTS_PER_SECOND.removed)
				) {
					console.warn(
						`[SPAM PROTECTION] Socket ${socket.id} превысил лимит удаления объектов`,
					)
					socket.emit('error', {
						code: 'RATE_LIMIT_EXCEEDED',
						message: 'Слишком частые удаления объектов',
					})
					return
				}

				const room = rooms.get(normalizedKey)
				if (room) {
					room.canvasObjects = room.canvasObjects.filter((obj: unknown) => {
						const o = obj as Record<string, unknown>
						return o.socketObjectId !== data.objectId
					})
				}

				socket
					.to(normalizedKey)
					.emit('object:removed_s', { objectId: data.objectId })
			},
		)
	})
}
