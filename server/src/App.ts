import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { RoomRoutes } from './routes/RoomRoutes'
import { rooms } from './store/rooms'
import { CanvasClearPayload, CanvasObjectPayload, User } from './types/Types'
import { normalizeRoomKey } from './utils/NormalizeRoomKey'

const app = express()
const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

RoomRoutes(app)

const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
	maxHttpBufferSize: 10e6,
})

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

		socket.to(normalizedKey).emit('object:modified_s', { object: data.object })
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

	socket.on('disconnect', () => {
		for (const [roomKey, room] of rooms.entries()) {
			const leavingUser = room.users.find((user: User) => user.id === socket.id)
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

httpServer.listen(PORT, () => {
	console.log(`Сервер на порту ${PORT}`)
})
