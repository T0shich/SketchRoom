import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import SideBar from '../components/SideBar'
import { DrawingCanvas } from '../modules/canvas'
import { Rooms } from '../modules/rooms'
import { getAuthToken, getAuthUser } from '../store/Auth'
import { BoardAPI, type Board, type CanvasSnapshot } from '../store/BoardAPI'
import { useFabric } from '../store/useFabric'
import { Layout } from '../ui/Layout'

interface JoinedRoomResponse {
	success: boolean
	roomKey: string
	message?: string
}

const socket: Socket = io('http://localhost:3000')

const EditorPage = () => {
	const [searchParams] = useSearchParams()
	const token = getAuthToken()
	const user = getAuthUser()
	const authenticated = Boolean(token && user)
	const modeQuery = searchParams.get('mode')
	const boardId = searchParams.get('boardId')
	const initialMode = modeQuery === 'join' ? 'join' : 'create'
	const fabricRef = useFabric(state => state.fabricRef)

	const [isConnecting, setIsConnecting] = useState(false)
	const [socketId, setSocketId] = useState<string>('')
	const [roomKey, setRoomKey] = useState<string | null>(null)
	const [joinError, setJoinError] = useState<string>('')
	const [board, setBoard] = useState<Board | null>(null)
	const [isBoardLoading, setIsBoardLoading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [saveStatus, setSaveStatus] = useState('')
	const [boardError, setBoardError] = useState('')

	useEffect(() => {
		const handleConnect = () => {
			setIsConnecting(true)
			setSocketId(socket.id || '')
		}

		const handleDisconnect = () => {
			setIsConnecting(false)
			setSocketId('')
			setRoomKey(null)
		}

		const handleJoinedRoom = (response: JoinedRoomResponse) => {
			if (response.success && response.roomKey) {
				setRoomKey(response.roomKey)
				setJoinError('')
				return
			}

			setJoinError(response.message || 'Не удалось войти в комнату')
		}

		socket.on('connect', handleConnect)
		socket.on('disconnect', handleDisconnect)
		socket.on('joinedRoom', handleJoinedRoom)

		if (socket.connected) {
			handleConnect()
		}

		return () => {
			socket.off('connect', handleConnect)
			socket.off('disconnect', handleDisconnect)
			socket.off('joinedRoom', handleJoinedRoom)
		}
	}, [])

	useEffect(() => {
		if (!board?.roomKey || !socket.connected) return
		socket.emit('joinRoom', board.roomKey)
	}, [board?.roomKey])

	useEffect(() => {
		if (!authenticated || !token || !boardId) {
			setBoard(null)
			setBoardError('')
			return
		}

		setIsBoardLoading(true)
		setBoardError('')

		void BoardAPI.getBoardById(boardId)
			.then(boardData => {
				setBoard(boardData)
				if (socket.connected) {
					socket.emit('joinRoom', boardData.roomKey)
				}
			})
			.catch(() => {
				setBoard(null)
				setBoardError('Не удалось открыть доску')
			})
			.finally(() => {
				setIsBoardLoading(false)
			})
	}, [authenticated, token, boardId])

	const handleJoinRoom = (key: string) => {
		const upperKey = key.toUpperCase()
		setJoinError('')

		if (!socket.connected) {
			setJoinError('Нет соединения с сервером')
			return
		}

		socket.emit('joinRoom', upperKey)
	}

	const saveBoardSnapshot = async () => {
		if (!board?.id) return

		const canvas = fabricRef?.current
		if (!canvas) {
			setSaveStatus('Холст ещё не готов')
			return
		}

		setIsSaving(true)
		setSaveStatus('')

		try {
			const viewportTransform = canvas.viewportTransform
			const rawSnapshot = canvas.toJSON() as Record<string, unknown>
			const backgroundColor = canvas.backgroundColor as unknown
			const snapshot: CanvasSnapshot = {
				version: String(rawSnapshot.version || '6.0.0'),
				objects: Array.isArray(rawSnapshot.objects) ? rawSnapshot.objects : [],
				background:
					typeof backgroundColor === 'string' ||
						(typeof backgroundColor === 'object' && backgroundColor !== null)
						? (backgroundColor as string | Record<string, unknown>)
						: undefined,
				height: canvas.getHeight(),
				width: canvas.getWidth(),
				left: viewportTransform?.[4],
				top: viewportTransform?.[5],
				scaleX: viewportTransform?.[0],
				scaleY: viewportTransform?.[3],
			}

			await BoardAPI.updateBoardSnapshot(board.id, snapshot)
			setSaveStatus('Сохранено')
		} catch {
			setSaveStatus('Ошибка сохранения')
		} finally {
			setIsSaving(false)
		}
	}

	if (!authenticated || !token || !user) {
		return <Navigate to='/login' replace />
	}

	if (boardId && isBoardLoading) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='text-sm text-slate-600'>Загрузка доски...</div>
			</div>
		)
	}

	if (boardId && boardError) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-500'>
					{boardError}
				</div>
			</div>
		)
	}

	if (!roomKey && !boardId) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
					<div className='mb-1 text-sm text-slate-500'>SketchRoom</div>
					<h1 className='mb-4 text-2xl font-semibold text-slate-900'>Совместная доска</h1>
					<div className='mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
						Аккаунт: {user.email}
					</div>
					<div className='mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
						{isConnecting ? `Подключено • ${socketId}` : 'Подключение к серверу...'}
					</div>
					<Rooms onJoinRoom={handleJoinRoom} initialMode={initialMode} />
					{joinError && <div className='mt-3 text-sm text-rose-500'>{joinError}</div>}
				</div>
			</div>
		)
	}

	if (!roomKey && boardId) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
					<h1 className='mb-3 text-xl font-semibold text-slate-900'>Открытие доски</h1>
					<div className='mb-2 text-sm text-slate-600'>{board?.title || 'Без названия'}</div>
					<div className='text-xs text-slate-500'>
						{isConnecting ? 'Подключение к комнате...' : 'Ожидание соединения с сервером...'}
					</div>
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
						<div className='text-sm font-medium text-slate-700'>
							{board?.title ? `${board.title} • ` : ''}Комната {roomKey}
						</div>
						<div className='text-xs text-slate-500'>Аккаунт: {user.email}</div>
						<div className='flex items-center gap-3'>
							{board?.id && (
								<>
									<button
										type='button'
										onClick={saveBoardSnapshot}
										disabled={isSaving}
										className='rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
									>
										{isSaving ? 'Сохранение...' : 'Сохранить'}
									</button>
									{saveStatus && <div className='text-xs text-slate-500'>{saveStatus}</div>}
								</>
							)}
							<div className='text-xs text-slate-500'>{isConnecting ? 'Онлайн' : 'Офлайн'}</div>
						</div>
					</div>
					<div className='min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
						<DrawingCanvas socket={socket} roomKey={roomKey ?? ''} initialSnapshot={board?.snapshot || null} />
					</div>
				</main>
			</div>
		</Layout>
	)
}

export default EditorPage
