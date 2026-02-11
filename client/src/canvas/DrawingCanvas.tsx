import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { Toolbar } from '../components/Toolbar'
import { usePasteImage } from '../hooks/usePasteImage'
import { Canvas, util, FabricObject, PencilBrush } from 'fabric'
import Zoom from '../components/Zoom'
import ViewportScroller from '../components/ViewportScroller'
interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
}

export const DrawingCanvas = ({ socket, roomKey }: DrawingCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fabricRef = useRef<Canvas | null>(null)
	usePasteImage({ fabricRef, socket, roomKey })
	const [brushColor, setBrushColor] = useState('#000000')
	const [brushSize, setBrushSize] = useState(3)
	const [isEraser, setIsEraser] = useState(false)
	const [prevColor, setPrevColor] = useState('#000000')
	const [isDrawingMode, setIsDrawingMode] = useState(false)
	useEffect(() => {
		if (!fabricRef.current) return
		fabricRef.current.isDrawingMode = isDrawingMode

		const objects = fabricRef.current.getObjects()

		console.log(objects)
	}, [isDrawingMode])

	useEffect(() => {
		if (!canvasRef.current) return

		const canvas = new Canvas(canvasRef.current, {
			width: window.innerWidth,
			height: window.innerHeight,
			isDrawingMode: true,
		})
		canvas.backgroundColor = '#ffffff'
		canvas.renderAll()

		canvas.freeDrawingBrush = new PencilBrush(canvas)
		canvas.freeDrawingBrush.color = brushColor
		canvas.freeDrawingBrush.width = brushSize

		fabricRef.current = canvas

		console.log(fabricRef.current)

		return () => {
			canvas.dispose()
		}
	}, [])
	useEffect(() => {
		if (!fabricRef.current?.freeDrawingBrush) return
		fabricRef.current.freeDrawingBrush.color = brushColor
		fabricRef.current.freeDrawingBrush.width = brushSize
	}, [brushColor, brushSize])

	useEffect(() => {
		if (!socket || !fabricRef.current) return

		socket.on('object:added_s', data => {
			const { object } = data
			console.log('=== ПОЛУЧЕНИЕ ===')
			console.log('data:', data)
			console.log('object type:', data.object?.type)
			console.log('object src:', data.object?.src?.substring(0, 100))

			util.enlivenObjects([object]).then(object => {
				object.forEach(obj => {
					if (obj instanceof FabricObject) {
						fabricRef.current?.add(obj)
					}
				})
				fabricRef.current?.renderAll()
			})
		})

		socket.on('object:modified_s', data => {
			const { object } = data

			util.enlivenObjects([object]).then(object => {
				object.forEach(obj => {
					if (obj instanceof FabricObject) {
						fabricRef.current?.add(obj)
					}
				})
				fabricRef.current?.renderAll()
			})
		})
	}, [socket])

	useEffect(() => {
		if (!fabricRef.current || !socket) return

		fabricRef.current.on('path:created', e => {
			socket.emit('object:added', { roomKey, object: e.path.toJSON() })
		})

		fabricRef.current.on('object:modified', e => {
			socket.emit('object:modified', { roomKey, object: e.target.toJSON() })
		})
	}, [socket, roomKey])
	return (
		<>
			<Toolbar
				brushColor={brushColor}
				setBrushColor={setBrushColor}
				brushSize={brushSize}
				setBrushSize={setBrushSize}
				onClear={() => {
					fabricRef.current?.getObjects().forEach(obj => {
						fabricRef.current?.remove(obj)
					})
					fabricRef.current?.renderAll()
				}}
				isDrawingMode={isDrawingMode}
				setIsDrawingMode={setIsDrawingMode}
			/>

			<button
				onClick={() => {
					setIsEraser(false)
					setBrushColor(prevColor)
				}}
			>
				Карандаш
			</button>
			<button
				onClick={() => {
					setPrevColor(brushColor)
					setIsEraser(true)
					setBrushColor('#ffffff')
				}}
			>
				Ластик
			</button>

			<Zoom fabricRef={fabricRef} />
			<ViewportScroller fabricRef={fabricRef} />

			<canvas ref={canvasRef} />
		</>
	)
}
