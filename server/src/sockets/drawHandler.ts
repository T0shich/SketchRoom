import { Server } from 'socket.io'
import { rooms } from '../store/rooms'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'
import { CanvasObjectPayload, CanvasClearPayload } from '../types/Types'
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

				socket
					.to(normalizedKey)
					.emit('object:removed_s', { objectId: data.objectId })
			},
		)
	})
}
