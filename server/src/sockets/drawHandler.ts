import { Server } from 'socket.io'
import { rooms } from '../store/rooms'
import { CanvasClearPayload, CanvasObjectPayload } from '../types/Types'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

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
