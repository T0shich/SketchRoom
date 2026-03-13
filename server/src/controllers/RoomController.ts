import { Request, Response } from 'express'
import { createRoomRecord, rooms } from '../store/rooms'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

export function RoomController() {
	// GetSections
	const getRooms = (req: Request, res: Response) => {
		const room = createRoomRecord()
		console.log(`Комната создана с ключом: ${room.key}`)
		res.status(201).json({ key: room.key })
	}
	const getRoomByKey = (req: Request, res: Response) => {
		const { key } = req.params
		if (typeof key !== 'string') {
			res
				.status(400)
				.json({ exists: false, message: 'Некорректный ключ комнаты' })
			return
		}

		const normalizedKey = normalizeRoomKey(key)
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
	}

	// PostSection
	const createRoom = (req: Request, res: Response) => {
		const room = createRoomRecord()
		console.log(`Комната создана с ключом: ${room.key}`)
		res.status(201).json({ key: room.key })
	}

	return {
		getRooms,
		getRoomByKey,
		createRoom,
	}
}
