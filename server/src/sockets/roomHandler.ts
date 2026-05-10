import { Server } from 'socket.io'
import { rooms } from '../store/rooms'
import { User } from '../types/Types'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

export function RoomHandler(io: Server) {
	const removeUserFromRoomRecord = (
		roomKey: string,
		targetSocketId: string,
	) => {
		const room = rooms.get(roomKey)
		if (!room) return

		const leavingUser = room.users.find(
			(user: User) => user.id === targetSocketId,
		)
		if (!leavingUser) return

		room.users = room.users.filter((user: User) => user.id !== targetSocketId)
		if (leavingUser.admin && room.users.length > 0) {
			room.users[0].admin = true
		}
	}

	const emitRoomUsersUpdated = (roomKey: string) => {
		const room = rooms.get(roomKey)
		if (!room) return

		io.to(roomKey).emit('roomUsersUpdated', {
			roomKey,
			users: [...room.users],
		})
	}

	io.on('connection', socket => {
		console.log('Подключился', socket.id)

		const leaveRoomInternal = (roomKeyRaw?: string) => {
			const normalizedKey = normalizeRoomKey(roomKeyRaw ?? socket.data.roomKey)
			if (!normalizedKey) return
			const room = rooms.get(normalizedKey)
			// always leave the socket.io room even if we don't have a record
			socket.leave(normalizedKey)
			socket.data.roomKey = undefined
			if (!room) return

			removeUserFromRoomRecord(normalizedKey, socket.id)
			emitRoomUsersUpdated(normalizedKey)
		}

		socket.on('leaveRoom', (roomKey?: string) => {
			leaveRoomInternal(roomKey)
			socket.emit('leftRoom', { success: true })
		})

		socket.on(
			'joinRoom',
			(payload: string | { roomKey: string; userName?: string }) => {
				const roomKey = typeof payload === 'string' ? payload : payload.roomKey
				const rawUserName =
					typeof payload === 'string' ? undefined : payload.userName
				const userName =
					typeof rawUserName === 'string'
						? rawUserName.trim().slice(0, 50)
						: undefined

				const normalizedKey = normalizeRoomKey(roomKey)
				if (!normalizedKey) {
					socket.emit('joinedRoom', {
						success: false,
						message: 'Некорректный ключ комнаты',
					})
					return
				}

				const room = rooms.get(normalizedKey)
				if (!room) {
					socket.emit('joinedRoom', {
						success: false,
						message: 'Комната не найдена',
						roomKey: normalizedKey,
					})
					return
				}

				const currentRoomKey = normalizeRoomKey(socket.data.roomKey)
				if (currentRoomKey && currentRoomKey !== normalizedKey) {
					socket.leave(currentRoomKey)
					const previousRoom = rooms.get(currentRoomKey)
					if (previousRoom) {
						previousRoom.users = previousRoom.users.filter(
							(user: User) => user.id !== socket.id,
						)
						emitRoomUsersUpdated(currentRoomKey)
					}
				}

				socket.join(normalizedKey)
				socket.data.roomKey = normalizedKey
				const existingUser = room.users.find(
					(user: User) => user.id === socket.id,
				)
				if (!existingUser) {
					const isFirstUser = room.users.length === 0
					room.users.push({ id: socket.id, name: userName, admin: isFirstUser })
				} else if (userName) {
					existingUser.name = userName
				}
				emitRoomUsersUpdated(normalizedKey)

				// Отправляем нового пользователя информацию о комнате (ack)
				// Клиент может запросить текущее состояние холста после регистрации обработчиков

				console.log(`${socket.id} присоединился к комнате ${normalizedKey}`)
				socket.emit('joinedRoom', { success: true, roomKey: normalizedKey })

				// Позволяем клиенту запросить текущее состояние холста в удобное для него времени
				socket.on('requestCanvasState', (reqRoomKey: string) => {
					const requestedKey = normalizeRoomKey(reqRoomKey)
					if (!requestedKey) return
					const r = rooms.get(requestedKey)
					if (!r) return
					// отправляем только запрашивающему сокету
					socket.emit('canvas:loadState', { objects: r.canvasObjects })
				})
			},
		)

		socket.on(
			'kickUser',
			(
				payload: { roomKey?: string; userId?: string },
				ack?: (res: { success: boolean; message?: string }) => void,
			) => {
				const normalizedKey = normalizeRoomKey(
					payload?.roomKey ?? socket.data.roomKey,
				)
				if (!normalizedKey) {
					ack?.({ success: false, message: 'Некорректный ключ комнаты' })
					return
				}
				const room = rooms.get(normalizedKey)
				if (!room) {
					ack?.({ success: false, message: 'Комната не найдена' })
					return
				}
				if (
					socket.data.roomKey !== normalizedKey ||
					!socket.rooms.has(normalizedKey)
				) {
					ack?.({ success: false, message: 'Вы не в этой комнате' })
					return
				}

				const requester = room.users.find((u: User) => u.id === socket.id)
				if (!requester?.admin) {
					ack?.({
						success: false,
						message: 'Только админ комнаты может удалять пользователей',
					})
					return
				}

				const targetUserId =
					typeof payload?.userId === 'string' ? payload.userId : ''
				if (!targetUserId) {
					ack?.({ success: false, message: 'Некорректный пользователь' })
					return
				}
				if (targetUserId === socket.id) {
					ack?.({ success: false, message: 'Нельзя удалить самого себя' })
					return
				}

				const existsInRoom = room.users.some((u: User) => u.id === targetUserId)
				if (!existsInRoom) {
					ack?.({ success: false, message: 'Пользователь не найден в комнате' })
					return
				}

				// Update room record first
				removeUserFromRoomRecord(normalizedKey, targetUserId)
				emitRoomUsersUpdated(normalizedKey)

				// If socket is still connected, force it to leave and notify
				const targetSocket = io.sockets.sockets.get(targetUserId)
				if (targetSocket) {
					targetSocket.leave(normalizedKey)
					if (targetSocket.data.roomKey === normalizedKey) {
						targetSocket.data.roomKey = undefined
					}
					targetSocket.emit('kickedFromRoom', {
						roomKey: normalizedKey,
						message: 'Вас удалили из комнаты',
					})
				}

				ack?.({ success: true })
			},
		)

		socket.on('disconnect', () => {
			for (const [roomKey, room] of rooms.entries()) {
				const leavingUser = room.users.find(
					(user: User) => user.id === socket.id,
				)
				if (!leavingUser) continue

				removeUserFromRoomRecord(roomKey, socket.id)

				emitRoomUsersUpdated(roomKey)
			}
			console.log('Отключился', socket.id)
		})
	})
}
