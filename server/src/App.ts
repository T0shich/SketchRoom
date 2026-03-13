import cors from 'cors'
import express from 'express'
import { createServer } from 'http'
import { RoomRoutes } from './routes/RoomRoutes'
import { initSockets } from './sockets'

const app = express()
const PORT = process.env.PORT || 3000
const httpServer = createServer(app)

app.use(cors())
app.use(express.json())

RoomRoutes(app)

initSockets(httpServer)

httpServer.listen(PORT, () => {
	console.log(`Сервер на порту ${PORT}`)
})
