import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'


interface SideBarProps {
	roomKey: string | null
	socket: Socket
	socketId: string
	currentUserEmail: string
}

interface User {
	id: string
	name?: string
	admin?: boolean
}

interface RoomUsersUpdatedPayload {
	roomKey: string
	users: User[]
}

const SideBar = ({ roomKey, socket, socketId, currentUserEmail }: SideBarProps) => {
	const [data, setData] = useState<RoomUsersUpdatedPayload | null>(null)
	const [isActive, setIsActive] = useState(false)
	const [kickError, setKickError] = useState('')

	const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
	const fallbackSocketId = typeof socket.id === 'string' ? socket.id : ''
	const effectiveSocketId = socketId || fallbackSocketId
	const isCurrentUserAdmin = Boolean(
		data?.users?.find(u => u.id === effectiveSocketId)?.admin,
	)

	useEffect(() => {
		if (!roomKey) return

		const fetchData = async () => {
			try {
				const response = await fetch(`${apiUrl}/rooms/${roomKey}`)
				const roomData = await response.json()
				if (!response.ok || !roomData?.exists) return

				setData(() => ({
					roomKey: roomData.key,
					users: Array.isArray(roomData.users) ? roomData.users : [],
				}))
			} catch (error) {
				console.error('Ошибка при загрузке данных:', error)
			}
		}

		fetchData()
	}, [roomKey, apiUrl])

	useEffect(() => {
		if (!roomKey) return

		const handleRoomUsersUpdated = (payload: RoomUsersUpdatedPayload) => {
			const normalizedLocalKey = roomKey.toUpperCase()
			if (payload.roomKey !== normalizedLocalKey) return

			setData((prev) => ({
				roomKey: prev?.roomKey || normalizedLocalKey,
				users: payload.users,
			}))
		}

		socket.on('roomUsersUpdated', handleRoomUsersUpdated)

		return () => {
			socket.off('roomUsersUpdated', handleRoomUsersUpdated)
		}
	}, [roomKey, socket])

	useEffect(() => {
		// reset any transient errors on room change
		setKickError('')
	}, [roomKey])

	const handleKickUser = (userId: string) => {
		if (!roomKey) return
		if (!socket.connected) {
			setKickError('Нет соединения с сервером')
			return
		}
		setKickError('')
		socket.emit(
			'kickUser',
			{ roomKey, userId },
			(res?: { success: boolean; message?: string }) => {
				if (!res?.success) {
					setKickError(res?.message || 'Не удалось удалить пользователя')
				}
			},
		)
	}

	return (
		<aside
			onMouseEnter={() => setIsActive(true)}
			onMouseLeave={() => setIsActive(false)}
			className='flex h-full w-20 flex-col items-center border-r border-slate-200 bg-white/80 px-3 py-5 backdrop-blur  transition-all duration-500 ease-in-out hover:w-64'>
			<div className='mb-6 text-xs font-semibold tracking-[0.18em] text-slate-400'>SR</div>
			{data?.users && (
				<ul className='space-y-2  w-full overflow-hidden '>
					{data.users.map((user) => {
						const displayName = (user.name || user.id).trim()
						const canKick =
							isCurrentUserAdmin &&
							isActive &&
							user.id !== effectiveSocketId
						return (
							<li
								key={user.id}
								className={
									`
                list-none py-2 px-4 shadow-sm rounded-xl font-bold text-lg 
                hover:bg-white/90 transition-all duration-300
                truncate whitespace-nowrap ${isActive ? 'text-left flex items-center justify-between gap-2' : 'text-center'}
                ${user?.admin ? 'bg-yellow-100 text-gray-700' : 'bg-slate-100 text-gray-700'}
              `
								}
								title={displayName}
							>
								{isActive ? (
									<>
										<span className='min-w-0 flex-1 truncate'>{displayName}</span>
										{canKick && (
											<button
												type='button'
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleKickUser(user.id)
												}}
												className='shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50'
											>
												Удалить
											</button>
										)}
									</>
								) : (
									displayName[0]
								)}
							</li>
						)
					})}
				</ul>
			)}
			{isActive && kickError && (
				<div className='mt-3 w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-rose-500'>
					{kickError}
				</div>
			)}
			<div className='mt-auto w-full text-center list-none bg-slate-100 text-gray-700 py-2 px-4 shadow-sm rounded-xl font-bold text-xl hover:bg-white/90 truncate ' >
				<span className='whitespace-nowrap'>
					{isActive ? currentUserEmail : currentUserEmail[0]}
				</span>
			</div>
		</aside>
	)
}

export default SideBar
