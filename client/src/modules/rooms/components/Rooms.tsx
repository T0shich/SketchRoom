import axios , {AxiosError} from 'axios'
import { useState } from 'react'

interface RoomsProps {
	onJoinRoom: (key: string) => void
}
export const Rooms = ({ onJoinRoom }: RoomsProps) => {
	const [isCreating, setIsCreating] = useState(false)
	const [isJoining, setIsJoining] = useState(false)
	const [roomKey, setRoomKey] = useState<string>('')
	const [inputKey, setInputKey] = useState<string>('')

	const createRoom = async () => {
		try {
			const response = await axios.post('http://localhost:3000/rooms')
			const { key } = response.data
			setRoomKey(key)
			onJoinRoom(key)
			console.log('Комната создана', key)
		} catch (error) {
			console.error('Ошибка при создании комнаты:', error)
		}
	}

	const joinRoom = async (key: string) => {
		try {
			const response = await axios.get(`http://localhost:3000/rooms/${key}`)
			if (response.data.exists) {
				setRoomKey(response.data.key)
				onJoinRoom(response.data.key)
				console.log('Присоединение к комнате:', key)
			}
		} catch (err) {
			const error = err as AxiosError
			if (error.response?.status === 404) {
				console.error('Комната не найдена')
			} else {
				console.error('Ошибка при присоединении к комнате')
			}
			console.error('Ошибка при присоединении к комнате:', error.message)
		}
	}

	const handleCreateRoom = async () => {
		await createRoom()
		setIsCreating(true)
		setIsJoining(false)
	}

	const handleJoinRoom = () => {
		setIsJoining(true)
		setIsCreating(false)
	}

	return (
		<div className='container'>
			<div className='buttons'>
				<button onClick={handleCreateRoom}>Создать</button>
				<button onClick={handleJoinRoom}>Присоединиться</button>
			</div>

			{isCreating && roomKey && (
				<div className='create-room'>
					Комната создана! Номер комнаты: {roomKey}
				</div>
			)}
			{isJoining && (
				<div className='join-room'>
					<input
						type='text'
						placeholder='Введите номер комнаты'
						value={inputKey}
						onChange={e => setInputKey(e.target.value.toUpperCase())}
					/>
					<button type='submit' onClick={() => joinRoom(inputKey)}>
						Присоединиться
					</button>
				</div>
			)}
		</div>
	)
}
