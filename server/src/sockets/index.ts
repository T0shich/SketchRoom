import { Server } from 'socket.io'
import { RoomHandler } from './roomHandler'
import { DrawHandler } from './drawHandler'
export const initSockets = (
	httpServer: ReturnType<typeof import('http').createServer>,
) => {
	const io = new Server(httpServer, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
		},
		maxHttpBufferSize: 10e6,
	})

	RoomHandler(io)
	DrawHandler(io)

}

