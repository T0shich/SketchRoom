import { Room } from '../types/Types'
import { generateRoomKey } from '../utils/GenerateRoomKey'

export const rooms = new Map<string, Room>()

export const createRoomRecord = (forcedKey?: string) => {
	const key = forcedKey ?? generateRoomKey()
	const room: Room = {
		key,
		createdAt: new Date(),
		users: [],
	}

	rooms.set(key, room)
	return room
}

export const ensureRoomRecord = (key: string) => {
	const existingRoom = rooms.get(key)
	if (existingRoom) {
		return existingRoom
	}

	return createRoomRecord(key)
}
