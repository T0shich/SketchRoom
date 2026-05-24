import { useEffect, useRef, useState } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import { Socket } from 'socket.io-client'
import type { Board } from '../../../store/BoardAPI'
import type {
	JoinedRoomResponse,
	JoinRequest,
	KickedFromRoomPayload,
	RoomJoinRequestsUpdatedPayload,
	RoomUser,
	RoomUsersUpdatedPayload,
} from './types'

interface UseRoomSocketProps {
	socket: Socket
	user: any
	searchParams: URLSearchParams
	setSearchParams: SetURLSearchParams
	board: Board | null
}

export const useRoomSocket = ({
	socket,
	user,
	searchParams,
	setSearchParams,
	board,
}: UseRoomSocketProps) => {
	const [isConnecting, setIsConnecting] = useState(false)
	const [socketId, setSocketId] = useState<string>('')
	const [roomKey, setRoomKey] = useState<string | null>(null)
	const [joinError, setJoinError] = useState<string>('')
	const [roomUsers, setRoomUsers] = useState<RoomUser[]>([])
	const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
	const [joinRequestError, setJoinRequestError] = useState('')
	const [pendingJoinRequestIds, setPendingJoinRequestIds] = useState<string[]>(
		[],
	)

	const previousActiveRoomKeyRef = useRef<string | null>(null)
	const previousUrlRoomKeyRef = useRef<string | null>(null)

	const activeRoomKey = (board?.roomKey ?? roomKey)?.toUpperCase() ?? null
	const isRoomAdmin = Boolean(
		activeRoomKey && roomUsers.find(u => u.id === socketId)?.admin,
	)

	useEffect(() => {
		const handleConnect = () => {
			setIsConnecting(true)
			setSocketId(socket.id || '')
		}

		const handleDisconnect = () => {
			setIsConnecting(false)
			setSocketId('')
			setRoomKey(null)
			setSearchParams(
				prev => {
					const boardId = prev.get('boardId')
					if (boardId) {
						const next = new URLSearchParams()
						next.set('boardId', boardId)
						return next
					}
					const next = new URLSearchParams(prev)
					next.delete('roomKey')
					return next
				},
				{ replace: true },
			)
		}

		const handleJoinedRoom = (response: JoinedRoomResponse) => {
			if (response.success && response.roomKey) {
				setJoinError('')
				if (Array.isArray(response.users)) setRoomUsers(response.users)
				if (Array.isArray(response.joinRequests))
					setJoinRequests(response.joinRequests)

				setSearchParams(
					prev => {
						const currentBoardId = prev.get('boardId')
						const next = new URLSearchParams()
						if (currentBoardId) {
							next.set('boardId', currentBoardId)
						} else {
							next.set('roomKey', response.roomKey)
						}
						return next
					},
					{ replace: true },
				)

				setRoomKey(response.roomKey)

				if (socket.connected) {
					socket.emit('requestCanvasState', response.roomKey)
				}
				return
			}
			setJoinError(response.message || 'Не удалось войти в комнату')
		}

		socket.on('connect', handleConnect)
		socket.on('disconnect', handleDisconnect)
		socket.on('joinedRoom', handleJoinedRoom)
		socket.on('kickedFromRoom', (payload: KickedFromRoomPayload) => {
			if (!payload?.roomKey) return
			const kickedRoomKey = payload.roomKey.toUpperCase()
			setJoinError(payload.message || 'Вас удалили из комнаты')
			setRoomUsers([])

			setSearchParams(
				prev => {
					if (!prev.get('boardId')) {
						const next = new URLSearchParams()
						next.set('mode', 'join')
						return next
					}
					return prev
				},
				{ replace: true },
			)

			if (socket.connected) {
				socket.emit('leaveRoom', kickedRoomKey)
			}
		})

		if (socket.connected) handleConnect()

		return () => {
			socket.off('connect', handleConnect)
			socket.off('disconnect', handleDisconnect)
			socket.off('joinedRoom', handleJoinedRoom)
			socket.off('kickedFromRoom')
		}
	}, [setSearchParams, socket])

	useEffect(() => {
		if (!activeRoomKey) {
			setJoinRequests([])
			return
		}
		const handleJoinRequestsUpdated = (
			payload: RoomJoinRequestsUpdatedPayload,
		) => {
			if (!payload?.roomKey || payload.roomKey.toUpperCase() !== activeRoomKey)
				return
			setJoinRequests(Array.isArray(payload.requests) ? payload.requests : [])
		}
		socket.on('roomJoinRequestsUpdated', handleJoinRequestsUpdated)
		return () => {
			socket.off('roomJoinRequestsUpdated', handleJoinRequestsUpdated)
		}
	}, [activeRoomKey, socket])

	useEffect(() => {
		if (!activeRoomKey) {
			setRoomUsers([])
			return
		}
		const handleRoomUsersUpdated = (payload: RoomUsersUpdatedPayload) => {
			if (!payload?.roomKey || payload.roomKey.toUpperCase() !== activeRoomKey)
				return
			setRoomUsers(Array.isArray(payload.users) ? payload.users : [])
		}
		socket.on('roomUsersUpdated', handleRoomUsersUpdated)
		return () => {
			socket.off('roomUsersUpdated', handleRoomUsersUpdated)
		}
	}, [activeRoomKey, socket])

	useEffect(() => {
		if (!board?.roomKey || !isConnecting) return
		const userName = user?.name || user?.email
		socket.emit('joinRoom', { roomKey: board.roomKey, userName })
	}, [board?.roomKey, isConnecting, socket, user])

	useEffect(() => {
		const currentBoardId = searchParams.get('boardId')
		if (currentBoardId) return
		const paramRoomKey = searchParams.get('roomKey')
		const previousUrlRoomKey = previousUrlRoomKeyRef.current
		previousUrlRoomKeyRef.current = paramRoomKey
		if (!paramRoomKey) {
			if (previousUrlRoomKey) setRoomKey(null)
			return
		}
		if (roomKey !== paramRoomKey) {
			setRoomKey(paramRoomKey)
		}
	}, [searchParams, roomKey])

	useEffect(() => {
		if (!isConnecting) {
			previousActiveRoomKeyRef.current = activeRoomKey
			return
		}
		const previousActiveRoomKey = previousActiveRoomKeyRef.current
		if (previousActiveRoomKey && previousActiveRoomKey !== activeRoomKey) {
			socket.emit('leaveRoom', previousActiveRoomKey)
		}
		previousActiveRoomKeyRef.current = activeRoomKey
	}, [activeRoomKey, isConnecting, socket])

	useEffect(() => {
		return () => {
			const previousActiveRoomKey = previousActiveRoomKeyRef.current
			if (previousActiveRoomKey && socket.connected) {
				socket.emit('leaveRoom', previousActiveRoomKey)
			}
		}
	}, [socket])

	useEffect(() => {
		const paramRoomKey = searchParams.get('roomKey')
		if (!paramRoomKey) return
		if (roomKey && roomKey.toUpperCase() === paramRoomKey.toUpperCase()) return
		if (isConnecting) {
			const userName = user?.name || user?.email
			socket.emit('joinRoom', { roomKey: paramRoomKey, userName })
		}
	}, [searchParams, isConnecting, roomKey, user, socket])

	const handleJoinRoom = (key: string) => {
		const upperKey = key.toUpperCase()
		setJoinError('')
		if (!socket.connected) {
			setJoinError('Нет соединения с сервером')
			return
		}
		socket.emit('joinRoom', {
			roomKey: upperKey,
			userName: user?.name || user?.email,
		})
	}

	const handleApproveJoinRequest = (userId: string) => {
		if (
			!activeRoomKey ||
			!socket.connected ||
			pendingJoinRequestIds.includes(userId)
		)
			return
		setJoinRequestError('')
		setPendingJoinRequestIds(prev =>
			prev.includes(userId) ? prev : [...prev, userId],
		)
		socket.emit(
			'approveJoinRequest',
			{ roomKey: activeRoomKey, userId },
			(res?: { success: boolean; message?: string }) => {
				setPendingJoinRequestIds(prev => prev.filter(id => id !== userId))
				if (!res?.success)
					setJoinRequestError(res?.message || 'Не удалось подтвердить заявку')
			},
		)
	}

	const handleDenyJoinRequest = (userId: string) => {
		if (
			!activeRoomKey ||
			!socket.connected ||
			pendingJoinRequestIds.includes(userId)
		)
			return
		setJoinRequestError('')
		setPendingJoinRequestIds(prev =>
			prev.includes(userId) ? prev : [...prev, userId],
		)
		socket.emit(
			'denyJoinRequest',
			{ roomKey: activeRoomKey, userId },
			(res?: { success: boolean; message?: string }) => {
				setPendingJoinRequestIds(prev => prev.filter(id => id !== userId))
				if (!res?.success)
					setJoinRequestError(res?.message || 'Не удалось отклонить заявку')
			},
		)
	}

	return {
		isConnecting,
		socketId,
		roomKey,
		activeRoomKey,
		isRoomAdmin,
		joinError,
		roomUsers,
		joinRequests,
		joinRequestError,
		pendingJoinRequestIds,
		setRoomKey,
		handleJoinRoom,
		handleApproveJoinRequest,
		handleDenyJoinRequest,
	}
}
