import { Server } from 'socket.io'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'
import { rooms } from '../store/rooms'
import { User } from '../types/Types'

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
		
		socket.on('joinRoom', (roomKey: string) => {
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
			if (!room.users.some((user: User) => user.id === socket.id)) {
				const isFirstUser = room.users.length === 0
				room.users.push({ id: socket.id, admin: isFirstUser })
			}
			emitRoomUsersUpdated(normalizedKey)

			console.log(`${socket.id} присоединился к комнате ${normalizedKey}`)
			socket.emit('joinedRoom', { success: true, roomKey: normalizedKey })
		})

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
