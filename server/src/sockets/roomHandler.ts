import { Server } from 'socket.io'
import { rooms } from '../store/rooms'
import { User } from '../types/Types'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

export function RoomHandler(io: Server) {
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

			const leavingUser = room.users.find((user: User) => user.id === socket.id)
			if (!leavingUser) {
				emitRoomUsersUpdated(normalizedKey)
				return
			}

			room.users = room.users.filter((user: User) => user.id !== socket.id)
			if (leavingUser.admin && room.users.length > 0) {
				room.users[0].admin = true
			}
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

		socket.on('disconnect', () => {
			for (const [roomKey, room] of rooms.entries()) {
				const leavingUser = room.users.find(
					(user: User) => user.id === socket.id,
				)
				if (!leavingUser) continue

				room.users = room.users.filter((user: User) => user.id !== socket.id)

				// передать права администратора следующему пользователю
				if (leavingUser.admin && room.users.length > 0) {
					room.users[0].admin = true
				}

				emitRoomUsersUpdated(roomKey)
			}
			console.log('Отключился', socket.id)
		})
	})
}
