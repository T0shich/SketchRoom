import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { env } from './config/env'
import { AuthRoutes } from './routes/AuthRoutes'
import { BoardRoutes } from './routes/BoardRoutes'
import { RoomRoutes } from './routes/RoomRoutes'
import { initSockets } from './sockets'
import { prisma } from './types/Prisma'

const app = express()
const PORT = env.PORT
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

RoomRoutes(app)
AuthRoutes(app)
BoardRoutes(app)
initSockets(httpServer)

app.get('/users', async (req, res) => {
	const users = await prisma.user.findMany()
	res.json(users)
})

prisma
	.$connect()
	.then(() => {
		console.log('Подключение к базе данных успешно')
	})
	.catch(err => {
		console.error('Ошибка подключения к базе данных:', err)
	})

httpServer.listen(PORT, () => {
	console.log(`Сервер на порту ${PORT}`)
})
