import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'

interface DrawingCanvasProps {
    socket: Socket | null
    roomKey: string
}

export const DrawingCanvas = ({ socket, roomKey }: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    useEffect(() => {
        if (!socket) return

        const handleStartDrawing = (data: { x: number; y: number }) => {
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return
            ctx.beginPath()
            ctx.moveTo(data.x, data.y)
        }

        const handleDrawing = (data: { x: number; y: number }) => {
            const ctx = canvasRef.current?.getContext('2d')
            if (!ctx) return
            ctx.lineTo(data.x, data.y)
            ctx.stroke()
        }

        socket.on('startDrawing', handleStartDrawing)
        socket.on('drawing', handleDrawing)

        return () => {
            socket.off('startDrawing', handleStartDrawing)
            socket.off('drawing', handleDrawing)
        }
    }, [socket])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        const x = e.nativeEvent.offsetX
        const y = e.nativeEvent.offsetY

        setIsDrawing(true)
        ctx.beginPath()
        ctx.moveTo(x, y)

        socket?.emit('startDrawing', { x, y, roomKey })
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return

        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return

        const x = e.nativeEvent.offsetX
        const y = e.nativeEvent.offsetY

        ctx.lineTo(x, y)
        ctx.stroke()

        socket?.emit('drawing', { x, y, roomKey })
    }

    const stopDrawing = () => setIsDrawing(false)

    return (
        <canvas
            ref={canvasRef}
            width={800}
            height={600}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ border: '1px solid black', cursor: 'crosshair' }}
        />
    )
}