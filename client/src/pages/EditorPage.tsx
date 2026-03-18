import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import { Layout } from '../components/Layout'
import SideBar from '../components/SideBar'
import { DrawingCanvas } from '../modules/canvas'
import { Rooms } from '../modules/rooms'
import { getAuthToken, getAuthUser, isAuthenticated } from '../store/auth'

interface JoinedRoomResponse {
	success: boolean
	roomKey: string
	message?: string
}

const socket: Socket = io('http://localhost:3000')

const EditorPage = () => {
	const [searchParams] = useSearchParams()
	const authenticated = isAuthenticated()
	const user = getAuthUser()
	const token = getAuthToken()
	const modeQuery = searchParams.get('mode')
	const initialMode = modeQuery === 'join' ? 'join' : 'create'

	const [isConnecting, setIsConnecting] = useState(false)
	const [socketId, setSocketId] = useState<string>('')
	const [roomKey, setRoomKey] = useState<string | null>(null)
	const [joinError, setJoinError] = useState<string>('')

	if (!authenticated || !token || !user) {
		return <Navigate to='/login' replace />
	}

	useEffect(() => {
		socket.on('connect', () => {
			setIsConnecting(true)
			setSocketId(socket.id || '')
		})

		socket.on('disconnect', () => {
			setIsConnecting(false)
			setSocketId('')
			setRoomKey(null)
		})

		socket.on('joinedRoom', (response: JoinedRoomResponse) => {
			if (response.success && response.roomKey) {
				setRoomKey(response.roomKey)
				setJoinError('')
				return
			}

			setJoinError(response.message || 'Не удалось войти в комнату')
		})

		return () => {
			socket.off('connect')
			socket.off('disconnect')
			socket.off('joinedRoom')
		}
	}, [])

	const handleJoinRoom = (key: string) => {
		const upperKey = key.toUpperCase()
		setJoinError('')

		if (!socket.connected) {
			setJoinError('Нет соединения с сервером')
			return
		}

		socket.emit('joinRoom', upperKey)
	}

	if (!roomKey) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
					<div className='mb-1 text-sm text-slate-500'>SketchRoom</div>
					<h1 className='mb-4 text-2xl font-semibold text-slate-900'>Совместная доска</h1>
					<div className='mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
						Аккаунт: {user.email}
					</div>
					<div className='mb-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
						{isConnecting ? `Подключено • ${socketId}` : 'Подключение к серверу...'}
					</div>
					<Rooms onJoinRoom={handleJoinRoom} initialMode={initialMode} />
					{joinError && <div className='mt-3 text-sm text-rose-500'>{joinError}</div>}
				</div>
			</div>
		)
	}

	return (
		<Layout>
			<div className='flex h-full w-full'>
				<SideBar roomKey={roomKey} socket={socket} currentUserEmail={user.email} />
				<main className='flex h-full min-w-0 flex-1 flex-col gap-4 p-4'>
					<div className='flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
						<div className='text-sm font-medium text-slate-700'>Комната {roomKey}</div>
						<div className='text-xs text-slate-500'>Аккаунт: {user.email}</div>
						<div className='text-xs text-slate-500'>{isConnecting ? 'Онлайн' : 'Офлайн'}</div>
					</div>
					<div className='min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
						<DrawingCanvas socket={socket} roomKey={roomKey} />
					</div>
				</main>
			</div>
		</Layout>
	)
}

export default EditorPage
