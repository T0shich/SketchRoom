import express from 'express'
import { RoomController } from '../controllers/RoomController';
export function RoomRoutes(app: express.Application) {

	const roomController = RoomController()  
	app.get('/rooms', roomController.getRooms);

	app.get('/rooms/:key', roomController.getRoomByKey);
	
	app.post('/rooms', roomController.createRoom);

}