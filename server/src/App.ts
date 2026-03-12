import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

interface User {
	id: string
	name?: string
	admin?: boolean
}

interface Room {
	key: string
	createdAt: Date
	users: User[]
}

interface CanvasObjectPayload {
	roomKey?: string
	object?: unknown
}

interface CanvasClearPayload {
	roomKey?: string
}

const app = express()
const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

const rooms = new Map<string, Room>()

app.use(cors())
app.use(express.json())

const generateRoomKey = () => {
	return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const normalizeRoomKey = (roomKey?: string) => {
	if (typeof roomKey !== 'string') return null
	const normalized = roomKey.trim().toUpperCase()
	return normalized.length ? normalized : null
}

app.post('/rooms', (req, res) => {
	const key = generateRoomKey()
	const room: Room = {
		key,
		createdAt: new Date(),
		users: [],
	}

	rooms.set(key, room)
	console.log(`Комната создана с ключом: ${key}`)
	res.status(201).json({ key })
})

app.get('/rooms/:key', (req, res) => {
	const normalizedKey = normalizeRoomKey(req.params.key)
	if (!normalizedKey) {
		res
			.status(400)
			.json({ exists: false, message: 'Некорректный ключ комнаты' })
		return
	}

	const room = rooms.get(normalizedKey)

	if (room) {
		res.json({ exists: true, key: room.key, users: room.users })
		console.log(`Вы подключились к комнате ${room.key}`)
	} else {
		res.status(404).json({ exists: false, message: 'Комната не найдена' })
	}
})

app.get('/rooms', (req, res) => {
	const allRooms = Array.from(rooms.values())
	res.json(allRooms)
})

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
					user => user.id !== socket.id,
				)
				emitRoomUsersUpdated(currentRoomKey)
			}
		}

		socket.join(normalizedKey)
		socket.data.roomKey = normalizedKey
		if (!room.users.some(user => user.id === socket.id)) {
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

	socket.on('disconnect', () => {
		for (const [roomKey, room] of rooms.entries()) {
			const leavingUser = room.users.find(user => user.id === socket.id)
			if (!leavingUser) continue

			room.users = room.users.filter(user => user.id !== socket.id)

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
