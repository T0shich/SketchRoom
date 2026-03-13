import { Room } from '../types/Types'
import { generateRoomKey } from '../utils/GenerateRoomKey'

export const rooms = new Map<string, Room>()

export const createRoomRecord = () => {
	const key = generateRoomKey()
	const room: Room = {
		key,
		createdAt: new Date(),
		users: [],
	}

	rooms.set(key, room)
	return room
}
