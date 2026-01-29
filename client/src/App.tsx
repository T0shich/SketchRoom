import './App.css'
import { io } from 'socket.io-client'
import { useState, useEffect } from 'react'
import { DrawingCanvas } from './canvas/DrawingCanvas'
import { Rooms } from './components/Rooms'
function App() {
	const [isConnecting, setIsConnecting] = useState(false)
	const [socketId, setSocketId] = useState<string>('')

	useEffect(() => {
		const socket = io('http://localhost:3000')
		socket.on('connect', () => {
			console.log('Подключение к серверу', socket.id)
			setIsConnecting(true)
			setSocketId(socket.id || '')
		})
		socket.on('disconnect', () => {
			console.log('Отключение от сервера')
			setIsConnecting(false)
			setSocketId('')
		})
		return () => {
			socket.disconnect()
		}
	}, [])
	return (
		<>
			<div className=''>
				{isConnecting ? `Подключен ${socketId}` : `Отключено`}
			</div>
			<div className=''>
				<Rooms />
				<DrawingCanvas />
			</div>
		</>
	)
}

export default App
