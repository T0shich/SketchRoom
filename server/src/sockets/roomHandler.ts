import { Server } from 'socket.io'
import { ensureRoomRecord, rooms } from '../store/rooms'
import { JoinRequest, User } from '../types/Types'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

export function RoomHandler(io: Server) {
	const normalizeRequestName = (name?: string) => {
		if (typeof name !== 'string') return ''
		return name.trim().toLowerCase()
	}

	const removeUserFromRoomRecord = (
		roomKey: string,
		targetSocketId: string,
	) => {
		const room = rooms.get(roomKey)
		if (!room) return

		const leavingUser = room.users.find(
			(user: User) => user.id === targetSocketId,
		)
		if (!leavingUser) return

		room.users = room.users.filter((user: User) => user.id !== targetSocketId)
		if (leavingUser.admin && room.users.length > 0) {
			room.users[0].admin = true
		}
	}

	const emitRoomUsersUpdated = (roomKey: string) => {
		const room = rooms.get(roomKey)
		if (!room) return

		io.to(roomKey).emit('roomUsersUpdated', {
			roomKey,
			users: [...room.users],
		})
	}

	const emitRoomJoinRequestsUpdated = (roomKey: string) => {
		const room = rooms.get(roomKey)
		if (!room) return

		// Defensive: keep joinRequests unique (in case older sessions left duplicates in memory).
		const seenIds = new Set<string>()
		const seenNames = new Set<string>()
		const deduped: JoinRequest[] = []
		for (let i = room.joinRequests.length - 1; i >= 0; i--) {
			const req = room.joinRequests[i]
			if (!req?.id) continue
			const nameKey = normalizeRequestName(req.name)
			if (seenIds.has(req.id)) continue
			if (nameKey && seenNames.has(nameKey)) continue
			seenIds.add(req.id)
			if (nameKey) seenNames.add(nameKey)
			deduped.push(req)
		}
		room.joinRequests = deduped.reverse()

		io.to(roomKey).emit('roomJoinRequestsUpdated', {
			roomKey,
			requests: [...room.joinRequests],
		})
	}

	const upsertJoinRequest = (roomKey: string, request: JoinRequest) => {
		const room = rooms.get(roomKey)
		if (!room) return

		const nameKey = normalizeRequestName(request.name)

		// Always keep at most one request per socket id and per normalized name.
		room.joinRequests = room.joinRequests.filter(r => {
			if (r.id === request.id) return false
			if (nameKey && normalizeRequestName(r.name) === nameKey) return false
			return true
		})

		room.joinRequests.push({ id: request.id, name: request.name })
	}

	const removeJoinRequest = (
		roomKey: string,
		socketId: string,
		name?: string,
	) => {
		const room = rooms.get(roomKey)
		if (!room) return
		const nameKey = normalizeRequestName(name)
		room.joinRequests = room.joinRequests.filter(r => {
			if (r.id === socketId) return false
			if (nameKey && normalizeRequestName(r.name) === nameKey) return false
			return true
		})
	}

	const joinRoomInternal = (
		socketId: string,
		roomKey: string,
		userName?: string,
	) => {
		const room = rooms.get(roomKey)
		if (!room) return { success: false as const, message: 'Комната не найдена' }
		const targetSocket = io.sockets.sockets.get(socketId)
		if (!targetSocket)
			return { success: false as const, message: 'Пользователь не в сети' }

		// Detach from previous room if needed
		const currentRoomKey = normalizeRoomKey(targetSocket.data.roomKey)
		if (currentRoomKey && currentRoomKey !== roomKey) {
			targetSocket.leave(currentRoomKey)
			const previousRoom = rooms.get(currentRoomKey)
			if (previousRoom) {
				previousRoom.users = previousRoom.users.filter(
					(u: User) => u.id !== socketId,
				)
				emitRoomUsersUpdated(currentRoomKey)
			}
		}

		targetSocket.join(roomKey)
		targetSocket.data.roomKey = roomKey
		const existingUser = room.users.find((u: User) => u.id === socketId)
		if (!existingUser) {
			const isFirstUser = room.users.length === 0
			room.users.push({ id: socketId, name: userName, admin: isFirstUser })
		} else if (userName) {
			existingUser.name = userName
		}
		removeJoinRequest(roomKey, socketId, userName)
		emitRoomUsersUpdated(roomKey)
		emitRoomJoinRequestsUpdated(roomKey)
		return { success: true as const }
	}

	io.on('connection', socket => {
		console.log('Подключился', socket.id)

		// Canvas state sync: register once per connection.
		// This is needed for users who enter the room via approveJoinRequest (they may not call joinRoom again).
		socket.on(
			'requestCanvasState',
			(
				reqRoomKey: string,
				ack?: (res: { success: boolean; message?: string }) => void,
			) => {
				const requestedKey = normalizeRoomKey(reqRoomKey)
				if (!requestedKey) {
					ack?.({ success: false, message: 'Некорректный ключ комнаты' })
					return
				}
				if (
					socket.data.roomKey !== requestedKey ||
					!socket.rooms.has(requestedKey)
				) {
					ack?.({ success: false, message: 'Вы не в этой комнате' })
					return
				}
				const room = rooms.get(requestedKey)
				if (!room) {
					ack?.({ success: false, message: 'Комната не найдена' })
					return
				}

				socket.emit('canvas:loadState', { objects: room.canvasObjects })
				ack?.({ success: true })
			},
		)

		const leaveRoomInternal = (roomKeyRaw?: string) => {
			const normalizedKey = normalizeRoomKey(roomKeyRaw ?? socket.data.roomKey)
			if (!normalizedKey) return
			const room = rooms.get(normalizedKey)
			// always leave the socket.io room even if we don't have a record
			socket.leave(normalizedKey)
			socket.data.roomKey = undefined
			if (!room) return

			removeUserFromRoomRecord(normalizedKey, socket.id)
			emitRoomUsersUpdated(normalizedKey)
		}

		socket.on('leaveRoom', (roomKey?: string) => {
			leaveRoomInternal(roomKey)
			socket.emit('leftRoom', { success: true })
		})

		socket.on(
			'joinRoom',
			(payload: string | { roomKey: string; userName?: string }) => {
				const roomKey = typeof payload === 'string' ? payload : payload.roomKey
				const rawUserName =
					typeof payload === 'string' ? undefined : payload.userName
				const userName =
					typeof rawUserName === 'string'
						? rawUserName.trim().slice(0, 50)
						: undefined

				const normalizedKey = normalizeRoomKey(roomKey)
				if (!normalizedKey) {
					socket.emit('joinedRoom', {
						success: false,
						message: 'Некорректный ключ комнаты',
					})
					return
				}

				const room = ensureRoomRecord(normalizedKey)

				// If already a member (same socket), allow re-join
				const alreadyMember = room.users.some((u: User) => u.id === socket.id)
				if (!alreadyMember && room.users.length > 0) {
					upsertJoinRequest(normalizedKey, { id: socket.id, name: userName })
					emitRoomJoinRequestsUpdated(normalizedKey)
					socket.emit('joinedRoom', {
						success: false,
						roomKey: normalizedKey,
						message:
							'Запрос на вход отправлен владельцу. Ожидайте подтверждения.',
					})
					return
				}

				const currentRoomKey = normalizeRoomKey(socket.data.roomKey)
				if (currentRoomKey && currentRoomKey !== normalizedKey) {
					socket.leave(currentRoomKey)
					const previousRoom = rooms.get(currentRoomKey)
					if (previousRoom) {
						previousRoom.users = previousRoom.users.filter(
							(user: User) => user.id !== socket.id,
						)
						emitRoomUsersUpdated(currentRoomKey)
					}
				}

				joinRoomInternal(socket.id, normalizedKey, userName)

				// Отправляем нового пользователя информацию о комнате (ack)
				// Клиент может запросить текущее состояние холста после регистрации обработчиков

				console.log(`${socket.id} присоединился к комнате ${normalizedKey}`)
				socket.emit('joinedRoom', {
					success: true,
					roomKey: normalizedKey,
					users: room.users,
					joinRequests: room.joinRequests,
				})
			},
		)

		socket.on(
			'approveJoinRequest',
			(
				payload: { roomKey?: string; userId?: string },
				ack?: (res: { success: boolean; message?: string }) => void,
			) => {
				const normalizedKey = normalizeRoomKey(
					payload?.roomKey ?? socket.data.roomKey,
				)
				if (!normalizedKey) {
					ack?.({ success: false, message: 'Некорректный ключ комнаты' })
					return
				}
				const room = rooms.get(normalizedKey)
				if (!room) {
					ack?.({ success: false, message: 'Комната не найдена' })
					return
				}
				if (
					socket.data.roomKey !== normalizedKey ||
					!socket.rooms.has(normalizedKey)
				) {
					ack?.({ success: false, message: 'Вы не в этой комнате' })
					return
				}
				const admin = room.users.find((u: User) => u.id === socket.id)
				if (!admin?.admin) {
					ack?.({
						success: false,
						message: 'Только владелец может подтверждать заявки',
					})
					return
				}
				const targetUserId =
					typeof payload?.userId === 'string' ? payload.userId : ''
				if (!targetUserId) {
					ack?.({ success: false, message: 'Некорректный пользователь' })
					return
				}
				const req = room.joinRequests.find(r => r.id === targetUserId)
				if (!req) {
					// Idempotency: if user is already in the room, consider it approved.
					const alreadyInRoom = room.users.some(
						(u: User) => u.id === targetUserId,
					)
					if (alreadyInRoom) {
						ack?.({ success: true })
						return
					}
					ack?.({ success: false, message: 'Заявка не найдена' })
					return
				}

				const res = joinRoomInternal(targetUserId, normalizedKey, req.name)
				if (!res.success) {
					ack?.({ success: false, message: res.message })
					return
				}

				const targetSocket = io.sockets.sockets.get(targetUserId)
				if (targetSocket) {
					targetSocket.emit('joinedRoom', {
						success: true,
						roomKey: normalizedKey,
						users: room.users,
						joinRequests: room.joinRequests,
					})
				}
				ack?.({ success: true })
			},
		)

		socket.on(
			'denyJoinRequest',
			(
				payload: { roomKey?: string; userId?: string },
				ack?: (res: { success: boolean; message?: string }) => void,
			) => {
				const normalizedKey = normalizeRoomKey(
					payload?.roomKey ?? socket.data.roomKey,
				)
				if (!normalizedKey) {
					ack?.({ success: false, message: 'Некорректный ключ комнаты' })
					return
				}
				const room = rooms.get(normalizedKey)
				if (!room) {
					ack?.({ success: false, message: 'Комната не найдена' })
					return
				}
				if (
					socket.data.roomKey !== normalizedKey ||
					!socket.rooms.has(normalizedKey)
				) {
					ack?.({ success: false, message: 'Вы не в этой комнате' })
					return
				}
				const admin = room.users.find((u: User) => u.id === socket.id)
				if (!admin?.admin) {
					ack?.({
						success: false,
						message: 'Только владелец может отклонять заявки',
					})
					return
				}
				const targetUserId =
					typeof payload?.userId === 'string' ? payload.userId : ''
				if (!targetUserId) {
					ack?.({ success: false, message: 'Некорректный пользователь' })
					return
				}
				const existed = room.joinRequests.some(r => r.id === targetUserId)
				if (!existed) {
					ack?.({ success: false, message: 'Заявка не найдена' })
					return
				}

				removeJoinRequest(normalizedKey, targetUserId)
				emitRoomJoinRequestsUpdated(normalizedKey)
				const targetSocket = io.sockets.sockets.get(targetUserId)
				if (targetSocket) {
					targetSocket.emit('joinedRoom', {
						success: false,
						roomKey: normalizedKey,
						message: 'Запрос отклонён владельцем комнаты',
					})
				}
				ack?.({ success: true })
			},
		)

		socket.on(
			'kickUser',
			(
				payload: { roomKey?: string; userId?: string },
				ack?: (res: { success: boolean; message?: string }) => void,
			) => {
				const normalizedKey = normalizeRoomKey(
					payload?.roomKey ?? socket.data.roomKey,
				)
				if (!normalizedKey) {
					ack?.({ success: false, message: 'Некорректный ключ комнаты' })
					return
				}
				const room = rooms.get(normalizedKey)
				if (!room) {
					ack?.({ success: false, message: 'Комната не найдена' })
					return
				}
				if (
					socket.data.roomKey !== normalizedKey ||
					!socket.rooms.has(normalizedKey)
				) {
					ack?.({ success: false, message: 'Вы не в этой комнате' })
					return
				}

				const requester = room.users.find((u: User) => u.id === socket.id)
				if (!requester?.admin) {
					ack?.({
						success: false,
						message: 'Только админ комнаты может удалять пользователей',
					})
					return
				}

				const targetUserId =
					typeof payload?.userId === 'string' ? payload.userId : ''
				if (!targetUserId) {
					ack?.({ success: false, message: 'Некорректный пользователь' })
					return
				}
				if (targetUserId === socket.id) {
					ack?.({ success: false, message: 'Нельзя удалить самого себя' })
					return
				}

				const existsInRoom = room.users.some((u: User) => u.id === targetUserId)
				if (!existsInRoom) {
					ack?.({ success: false, message: 'Пользователь не найден в комнате' })
					return
				}

				// Update room record first
				removeUserFromRoomRecord(normalizedKey, targetUserId)
				emitRoomUsersUpdated(normalizedKey)

				// If socket is still connected, force it to leave and notify
				const targetSocket = io.sockets.sockets.get(targetUserId)
				if (targetSocket) {
					targetSocket.leave(normalizedKey)
					if (targetSocket.data.roomKey === normalizedKey) {
						targetSocket.data.roomKey = undefined
					}
					targetSocket.emit('kickedFromRoom', {
						roomKey: normalizedKey,
						message: 'Вас удалили из комнаты',
					})
				}

				ack?.({ success: true })
			},
		)

		socket.on('disconnect', () => {
			for (const [roomKey, room] of rooms.entries()) {
				const hadRequest = room.joinRequests.some(r => r.id === socket.id)
				if (hadRequest) {
					removeJoinRequest(roomKey, socket.id)
					emitRoomJoinRequestsUpdated(roomKey)
				}

				const leavingUser = room.users.find(
					(user: User) => user.id === socket.id,
				)
				if (!leavingUser) continue

				removeUserFromRoomRecord(roomKey, socket.id)

				emitRoomUsersUpdated(roomKey)
			}
			console.log('Отключился', socket.id)
		})
	})
}
