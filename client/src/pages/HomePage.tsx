import { Link } from 'react-router-dom'
import { getAuthUser, isAuthenticated } from '../store/Auth'
import AuthButton from '../ui/AuthButton'
import { Layout } from '../ui/Layout'
import AuthPage from './AuthPage'
import { useState } from 'react'
import axios from 'axios'
import { AxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { BoardAPI } from '../store/BoardAPI'
import { io, Socket } from 'socket.io-client'

const socket: Socket = io('http://localhost:3000')
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const HomePage = () => {
	const navigate = useNavigate()
	const authenticated = isAuthenticated()
	const user = getAuthUser()
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string>('')
	const [isCreating, setIsCreating] = useState<boolean>(false)
	const [roomKey, setRoomKey] = useState<string>('')

	const handleJoinRoom = (key: string) => {
		const upperKey = key.toUpperCase()
		setError('')

		if (!socket.connected) {
			setError('Нет соединения с сервером')
			return
		}

		socket.emit('joinRoom', upperKey)
	}


	const createRoom = async () => {
		setIsLoading(true)
		setError('')
		const titleInput = window.prompt('Название доски', 'Новая доска')
		if (titleInput === null) return

		const title = titleInput.trim() || 'Новая доска'
		setIsCreating(true)
		setError('')

		try {
			const roomResponse = await axios.post(`${API_URL}/rooms`)
			const roomKey = roomResponse.data?.key

			if (typeof roomKey !== 'string' || !roomKey) {
				throw new Error('Некорректный room key')
			}

			const board = await BoardAPI.createBoard(title, roomKey)
			navigate(`/editor?boardId=${board.id}`)
		} catch {
			setError('Не удалось создать доску')
		} finally {
			setIsCreating(false)
		}
	}

	const joinRoom = async () => {
		const keyInput = window.prompt('Название комнаты', '')
		if (keyInput === null) return

		const key = keyInput.trim() || ''
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
				handleJoinRoom(response.data.key)
			}
			navigate(`/editor?boardId=${response.data.boardId}`)

		} catch (err) {
			const axiosError = err as AxiosError
			setError(axiosError.response?.status === 404 ? 'Комната не найдена' : 'Ошибка подключения')
		} finally {
			setIsLoading(false)
		}
	}


	return (
		<Layout>
			<div className='absolute right-0 top-0 flex justify-end'><AuthPage /></div>
			<div className='flex min-h-screen items-center justify-center p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg'>
					<h1 className='mb-2 text-center text-3xl font-bold text-slate-900/90'>SketchRoom</h1>
					{authenticated ? (
						<>
							<div className='mb-6 text-center text-sm text-slate-600'>
								Вы вошли как <span className='font-medium text-slate-800'>{user?.email}</span>
							</div>
							<div className='flex flex-col gap-3'>

								<AuthButton onClick={() => createRoom()} className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
									Создать холст
								</AuthButton>

								<AuthButton onClick={() => joinRoom()} className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
									Присоединиться к холсту
								</AuthButton>

								<Link to='/boards'>
									<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
										Просмотреть доски
									</AuthButton>
								</Link>
							</div>
						</>
					) : (
						<div className='mt-4 text-center text-sm text-slate-600'>
							Войдите в аккаунт, чтобы создать холст или присоединиться к комнате
						</div>
					)}
				</div>
			</div>
		</Layout >
	)
}

export default HomePage
