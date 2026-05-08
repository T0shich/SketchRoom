import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'


interface SideBarProps {
	roomKey: string | null
	socket: Socket
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

const SideBar = ({ roomKey, socket, currentUserEmail }: SideBarProps) => {
	const [data, setData] = useState<RoomUsersUpdatedPayload | null>(null)
	const [isActive, setIsActive] = useState(false)
	useEffect(() => {
		if (!roomKey) return

		const fetchData = async () => {
			try {
				const response = await fetch(`http://localhost:3000/rooms/${roomKey}`)
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
	}, [roomKey])

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

	return (
		<aside
			onMouseEnter={() => setIsActive(true)}
			onMouseLeave={() => setIsActive(false)}
			className='flex h-full w-20 flex-col items-center border-r border-slate-200 bg-white/80 px-3 py-5 backdrop-blur  transition-all duration-500 ease-in-out hover:w-64'>
			<div className='mb-6 text-xs font-semibold tracking-[0.18em] text-slate-400'>SR</div>
			{data?.users && (
				<ul className='space-y-2  w-full overflow-hidden '>
					{data.users.map((user, index) => (
						<li
							key={index}
							className={`
                list-none py-2 px-4 shadow-sm rounded-xl font-bold text-lg 
                hover:bg-white/90 transition-all duration-300
                truncate whitespace-nowrap text-center
                ${user?.admin ? 'bg-yellow-100 text-gray-700' : 'bg-slate-100 text-gray-700'}
              `}
							title={user.id.slice(0, 10)}
						>
							{isActive ? user.id.slice(0, 10) : user.id[0]}
						</li>
					))}
				</ul>
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
