import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'


interface SideBarProps {
	roomKey: string | null
	socket: Socket
}


interface RoomUsersUpdatedPayload {
	roomKey: string
	users: string[]
}

const SideBar = ({ roomKey, socket }: SideBarProps) => {
	const [data, setData] = useState<RoomUsersUpdatedPayload | null>(null)

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
			if (payload.roomKey !== roomKey) return

			setData((prev) => ({
				roomKey: prev?.roomKey || roomKey,
				users: payload.users,
			}))
		}

		socket.on('roomUsersUpdated', handleRoomUsersUpdated)

		return () => {
			socket.off('roomUsersUpdated', handleRoomUsersUpdated)
		}
	}, [roomKey, socket])

	return (
		<aside className='flex h-full w-20 flex-col items-center border-r border-slate-200 bg-white/80 px-3 py-5 backdrop-blur'>
			<div className='mb-6 text-xs font-semibold tracking-[0.18em] text-slate-400'>SR</div>
			{data?.users && (
				<div className='space-y-2  '>
					{data.users.map((user, index) => (
						<li className='list-none bg-slate-100 text-gray-700 py-2 px-4 shadow-sm rounded-xl font-bold text-xl hover:bg-white/90 transition-colors' key={index}>{user[0]}</li>
					))}
				</div>
			)}
		</aside>
	)
}

export default SideBar
