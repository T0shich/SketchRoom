import { Rooms } from '..'
import type { Board } from '../../../store/BoardAPI'

interface EditorLobbyProps {
	boardId: string | null
	board: Board | null
	activeRoomKey: string | null
	isBoardLoading: boolean
	boardError: string
	isConnecting: boolean
	socketId: string
	userEmail: string
	initialMode: 'join' | 'create'
	joinError: string
	onJoinRoom: (key: string) => void
}

const EditorLobby = ({ boardId, board, activeRoomKey, isBoardLoading, boardError, isConnecting, socketId, userEmail, initialMode, joinError, onJoinRoom }: EditorLobbyProps) => {
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
				<div className='rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-500'>{boardError}</div>
			</div>
		)
	}

	if (!activeRoomKey && boardId) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
					<h1 className='mb-3 text-xl font-semibold text-slate-900'>Открытие доски</h1>
					<div className='mb-2 text-sm text-slate-600'>{board?.title || 'Без названия'}</div>
					<div className='text-xs text-slate-500'>{isConnecting ? 'Подключение к комнате...' : 'Ожидание соединения с сервером...'}</div>
					{joinError && <div className='mt-3 text-sm text-rose-500'>{joinError}</div>}
				</div>
			</div>
		)
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
			<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
				<div className='mb-1 text-sm text-slate-500'>SketchRoom</div>
				<h1 className='mb-4 text-2xl font-semibold text-slate-900'>Совместная доска</h1>
				<div className='mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>Аккаунт: {userEmail}</div>
				<div className='mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
					{isConnecting ? `Подключено • ${socketId}` : 'Подключение к серверу...'}
				</div>
				<Rooms onJoinRoom={onJoinRoom} initialMode={initialMode} />
				{joinError && <div className='mt-3 text-sm text-rose-500'>{joinError}</div>}
			</div>
		</div>
	)
}
export default EditorLobby