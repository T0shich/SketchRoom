import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
export const DrawingCanvas = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const socketRef = useRef<Socket | null>(null)
	const [isDrawing, setIsDrawing] = useState(false)

	useEffect(() => {
		const socket = io('http://localhost:3000')
		socketRef.current = socket
		socket.on('startDrawing', data => {
			const canvas = canvasRef.current
			const ctx = canvas?.getContext('2d')
			if (!ctx) return

			ctx.beginPath() // ← НОВЫЙ ПУТЬ!
			ctx.moveTo(data.x, data.y)
		})

		socket.on('drawing', data => {
			const canvas = canvasRef.current
			const ctx = canvas?.getContext('2d')
			if (!ctx) return

			ctx.lineTo(data.x, data.y)
			ctx.stroke()
		})

		return () => {
			socket.disconnect()
		}
	}, [])

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		const ctx = canvas?.getContext('2d')
		if (!ctx) return

    const x = e.nativeEvent.offsetX
		const y = e.nativeEvent.offsetY

		setIsDrawing(true)
		ctx.beginPath()
		ctx.moveTo(x, y)

		socketRef.current?.emit('startDrawing', { x, y })
	}

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return

		const canvas = canvasRef.current
		const ctx = canvas?.getContext('2d')
		if (!ctx) return

		const x = e.nativeEvent.offsetX
		const y = e.nativeEvent.offsetY

		ctx.lineTo(x, y)
		ctx.stroke()

		socketRef.current?.emit('drawing', {
			x: x,
			y: y,
		})
	}

	const stopDrawing = () => {
		setIsDrawing(false)
	}

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
