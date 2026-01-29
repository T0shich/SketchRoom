import axios from 'axios'
import { useState } from 'react'

export const Rooms = () => {
	const [isCreating, setIsCreating] = useState(false)
	const [isJoining, setIsJoining] = useState(false)
	const [roomKey, setRoomKey] = useState<string>('')

	const createRoom = () => {
		try {
			axios.post('http://localhost:3000/rooms', { key: roomKey })

			console.log('Комната создана')
		} catch (error) {
			console.error('Ошибка при создании комнаты:', error)
		}
	}

	const joinRoom = (key: string) => {
		try {
			axios.get(`http://localhost:3000/rooms/${key}`)
			console.log('Присоединение к комнате')
		} catch (error) {
			console.error('Ошибка при присоединении к комнате:', error)
		}
	}

	const handleCreateRoom = () => {
		createRoom()
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

			{isCreating && (
				<div className='create-room'>
					Комната создана! Номер комнаты: {roomKey}
				</div>
			)}
			{isJoining && (
				<div className='join-room'>
					<input
						type='text'
						placeholder='Введите номер комнаты'
						onChange={e => setRoomKey(e.target.value)}
					/>
					<button type='submit' onClick={() => joinRoom(roomKey)}>
						Присоединиться
					</button>
				</div>
			)}
		</div>
	)
}
