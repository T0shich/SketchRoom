import './App.css'
import { io, Socket } from 'socket.io-client'
import { useState, useEffect } from 'react'
import { DrawingCanvas } from './canvas/DrawingCanvas'
import { Rooms } from './components/Rooms'

const socket: Socket = io('http://localhost:3000')

function App() {
    const [isConnecting, setIsConnecting] = useState(false)
    const [socketId, setSocketId] = useState<string>('')
    const [roomKey, setRoomKey] = useState<string | null>(null)

    useEffect(() => {
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

        socket.on('joinedRoom', (response) => {
            console.log('joinedRoom:', response)
        })

        return () => {
            socket.off('connect')
            socket.off('disconnect')
            socket.off('joinedRoom')
        }
    }, [])

    const handleJoinRoom = (key: string) => {
        const upperKey = key.toUpperCase()
        setRoomKey(upperKey)
        socket.emit('joinRoom', upperKey)
    }

    return (
        <>
            <div>{isConnecting ? `Подключен ${socketId}` : `Отключено`}</div>
            <div>
                {!roomKey ? (
                    <Rooms onJoinRoom={handleJoinRoom} />
                ) : (
                    <>
                        <p>Комната: {roomKey}</p>
                        <DrawingCanvas socket={socket} roomKey={roomKey} />
                    </>
                )}
            </div>
        </>
    )
}

export default App