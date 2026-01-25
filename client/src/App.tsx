import './App.css'
import { io } from 'socket.io-client'
import { useState, useEffect } from 'react'

function App() {
	const [isConnecting, setIsConnecting] = useState(false)

	useEffect(() => {
		const socket = io('http://localhost:3000')

		socket.on('connect', () => {
			console.log('Подключение к серверу', socket.id)
			setIsConnecting(true)
		})
		socket.on('disconnect', () => {
			console.log('Отключение от сервера')
			setIsConnecting(false)
		})
		return () => {
			socket.disconnect()
		}
	}, [])
	return (
		<>
			<div className=''>{isConnecting ? `Подключено` : `Отключено`}</div>
		</>
	)
}

export default App
