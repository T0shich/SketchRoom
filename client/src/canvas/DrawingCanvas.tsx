import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { Toolbar } from '../components/Toolbar'
import { usePastImage } from '../hooks/usePasteImage'
interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
}

export const DrawingCanvas = ({ socket, roomKey }: DrawingCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isDrawing, setIsDrawing] = useState(false)
	usePastImage({canvasRef})
	const [brushColor, setBrushColor] = useState('#000000')
	const [brushSize, setBrushSize] = useState(3)
	const [isEraser, setIsEraser] = useState(false)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const resizeCanvas = () => {
			canvas.width = window.innerWidth
			canvas.height = window.innerHeight
		}

		resizeCanvas()
		window.addEventListener('resize', resizeCanvas)

		return () => window.removeEventListener('resize', resizeCanvas)
	}, [])

	useEffect(() => {
		if (!socket) return

		const handleStartDrawing = (data: {
			x: number
			y: number
			color?: string
			size?: number
			isEraser?: boolean
		}) => {
			const ctx = canvasRef.current?.getContext('2d')
			if (!ctx) return

			if (data.isEraser) {
				ctx.globalCompositeOperation = 'destination-out'
			} else {
				ctx.globalCompositeOperation = 'source-over'
				ctx.strokeStyle = data.color || '#000000'
			}
			ctx.lineWidth = data.size || 3
			ctx.lineCap = 'round'
			ctx.lineJoin = 'round'
			ctx.beginPath()
			ctx.moveTo(data.x, data.y)
		}

		const handleDrawing = (data: {
			x: number
			y: number
			color?: string
			size?: number
			isEraser?: boolean
		}) => {
			const ctx = canvasRef.current?.getContext('2d')
			if (!ctx) return

			if (data.isEraser) {
				ctx.globalCompositeOperation = 'destination-out'
			} else {
				ctx.globalCompositeOperation = 'source-over'
				ctx.strokeStyle = data.color || '#000000'
			}
			ctx.lineWidth = data.size || 3
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

	const getContext = () => {
		const ctx = canvasRef.current?.getContext('2d')
		if (ctx) {
			if (isEraser) {
				ctx.globalCompositeOperation = 'destination-out'
				ctx.lineWidth = brushSize
			} else {
				ctx.globalCompositeOperation = 'source-over'
				ctx.strokeStyle = brushColor
				ctx.lineWidth = brushSize
			}
			ctx.lineCap = 'round'
			ctx.lineJoin = 'round'
		}
		return ctx
	}

	const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const ctx = getContext()
		if (!ctx) return

		const x = e.nativeEvent.offsetX
		const y = e.nativeEvent.offsetY

		setIsDrawing(true)
		ctx.beginPath()
		ctx.moveTo(x, y)

		socket?.emit('startDrawing', {
			x,
			y,
			roomKey,
			color: brushColor,
			size: brushSize,
			isEraser,
		})
	}

	const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!isDrawing) return

		const ctx = getContext()
		if (!ctx) return

		const x = e.nativeEvent.offsetX
		const y = e.nativeEvent.offsetY

		ctx.lineTo(x, y)
		ctx.stroke()

		socket?.emit('drawing', {
			x,
			y,
			roomKey,
			color: brushColor,
			size: brushSize,
			isEraser,
		})
	}

	const stopDrawing = () => setIsDrawing(false)

	return (
		<>
			<Toolbar
				brushColor={brushColor}
				setBrushColor={setBrushColor}
				brushSize={brushSize}
				setBrushSize={setBrushSize}
				isEraser={isEraser}
				setIsEraser={setIsEraser}
			/>

			<canvas
				ref={canvasRef}
				onMouseDown={startDrawing}
				onMouseMove={draw}
				onMouseUp={stopDrawing}
				onMouseLeave={stopDrawing}
				className='block cursor-crosshair bg-white'
				style={{
					display: 'block',
					margin: 0,
					padding: 0,
					width: '100vw',
					height: '100vh',
				}}
			/>
		</>
	)
}
