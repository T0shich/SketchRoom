import { PrismaPg } from '@prisma/adapter-pg'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { createServer } from 'http'
import { PrismaClient } from './generated/prisma'
import { RoomRoutes } from './routes/RoomRoutes'
import { initSockets } from './sockets'
const app = express()
const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

app.use(cors())
app.use(express.json())

RoomRoutes(app)

initSockets(httpServer)

app.get('/users', async (req, res) => {
	const users = await prisma.user.findMany()
	res.json(users)
})

httpServer.listen(PORT, () => {
	console.log(`Сервер на порту ${PORT}`)
})
