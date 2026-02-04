import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

interface Room {
	key: string
	createdAt: Date
	users: string[]
}

const app = express()
const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

const rooms = new Map<string, Room>()

app.use(cors())
app.use(express.json())

//Room creation endpoint
const generateRoomKey = () => {
	return Math.random().toString(36).substring(2, 8).toUpperCase()
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
	const { key } = req.params
	const room = rooms.get(key.toUpperCase())

	if (room) {
		res.json({ exists: true, key: room.key })
		console.log(`Вы подключились к комнате`)
	} else {
		res.status(404).json({ exists: false, message: 'Комната не найдена' })
	}
})

app.get('/rooms', (req, res) => {
	const allRooms = Array.from(rooms.values())
	res.json(allRooms)
})

// WebSocket setup
const io = new Server(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
})

io.on('connection', socket => {
	console.log('Подключился', socket.id)

	socket.on('joinRoom', (roomKey: string) => {
		const room = rooms.get(roomKey.toUpperCase())
		if (room) {
			socket.join(roomKey.toUpperCase())
			room.users.push(socket.id)
			console.log(`${socket.id} присоединился к комнате ${roomKey}`)
			socket.emit('joinedRoom', { success: true, roomKey })
		} else {
		}
	})

	socket.on('object:added', data => {
		const { roomKey, object } = data
		if (roomKey) {
			socket.to(roomKey.toUpperCase()).emit('object:added_s', { object })
		}
	})
	socket.on('object:modified', data => {
		const { roomKey, object } = data
		if (roomKey) {
			socket.to(roomKey.toUpperCase()).emit('object:modified_s', { object })
		}
	})

	socket.on('disconnect', () => {
		console.log('Отключился', socket.id)
	})
})

httpServer.listen(PORT, () => {
	console.log(`Сервер на порту ${PORT}`)
})
