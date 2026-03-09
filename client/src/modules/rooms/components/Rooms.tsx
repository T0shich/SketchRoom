import axios, { AxiosError } from 'axios'
import { useState } from 'react'

interface RoomsProps {
	onJoinRoom: (key: string) => void
}

export const Rooms = ({ onJoinRoom }: RoomsProps) => {
	const [mode, setMode] = useState<'create' | 'join'>('create')
	const [roomKey, setRoomKey] = useState<string>('')
	const [inputKey, setInputKey] = useState<string>('')
	const [error, setError] = useState<string>('')
	const [isLoading, setIsLoading] = useState(false)

	const createRoom = async () => {
		setIsLoading(true)
		setError('')
		try {
			const response = await axios.post('http://localhost:3000/rooms')
			const { key } = response.data
			setRoomKey(key)
			onJoinRoom(key)
		} catch {
			setError('Не удалось создать комнату')
		} finally {
			setIsLoading(false)
		}
	}

	const joinRoom = async (key: string) => {
		if (!key.trim()) {
			setError('Введите ключ комнаты')
			return
		}

		setIsLoading(true)
		setError('')
		try {
			const response = await axios.get(`http://localhost:3000/rooms/${key}`)
			if (response.data.exists) {
				setRoomKey(response.data.key)
				onJoinRoom(response.data.key)
			}
		} catch (err) {
			const axiosError = err as AxiosError
			setError(axiosError.response?.status === 404 ? 'Комната не найдена' : 'Ошибка подключения')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1'>
				<button
					onClick={() => {
						setMode('create')
						setError('')
					}}
					className={`rounded-lg px-3 py-2 text-sm transition ${mode === 'create' ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
				>
					Создать
				</button>
				<button
					onClick={() => {
						setMode('join')
						setError('')
					}}
					className={`rounded-lg px-3 py-2 text-sm transition ${mode === 'join' ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
				>
					Войти
				</button>
			</div>

			{mode === 'create' ? (
				<button
					onClick={createRoom}
					disabled={isLoading}
					className='w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
				>
					{isLoading ? 'Создание...' : 'Создать комнату'}
				</button>
			) : (
				<div className='space-y-3'>
					<input
						type='text'
						placeholder='Ключ комнаты'
						value={inputKey}
						onChange={e => setInputKey(e.target.value.toUpperCase())}
						className='w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200'
					/>
					<button
						type='button'
						onClick={() => joinRoom(inputKey)}
						disabled={isLoading}
						className='w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isLoading ? 'Подключение...' : 'Войти в комнату'}
					</button>
				</div>
			)}

			{error && <div className='text-sm text-rose-500'>{error}</div>}
			{roomKey && mode === 'create' && <div className='text-xs text-slate-500'>Ключ: {roomKey}</div>}
		</div>
	)
}
