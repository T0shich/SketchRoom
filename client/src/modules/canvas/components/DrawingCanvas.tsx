import { Canvas, FabricObject, PencilBrush, util } from 'fabric'
import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { useFabric } from '../../../store/useFabric'
import { Toolbar } from './Toolbar'
import { ViewportScroller } from './ViewportScroller'
import { Zoom } from './Zoom'
import { usePasteImage } from '../hooks/usePasteImage'

interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
}

const INITIAL_BRUSH_COLOR = '#111827'
const INITIAL_BRUSH_SIZE = 3

export const DrawingCanvas = ({ socket, roomKey }: DrawingCanvasProps) => {
	const wrapperRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const previousColorRef = useRef(INITIAL_BRUSH_COLOR)
	const { fabricRef, setFabricRef } = useFabric()

	const [brushColor, setBrushColor] = useState(INITIAL_BRUSH_COLOR)
	const [brushSize, setBrushSize] = useState(INITIAL_BRUSH_SIZE)
	const [isEraser, setIsEraser] = useState(false)
	const [isDrawingMode, setIsDrawingMode] = useState(true)

	usePasteImage({ socket, roomKey })

	useEffect(() => {
		if (!fabricRef?.current) return
		fabricRef.current.isDrawingMode = isDrawingMode
	}, [isDrawingMode, fabricRef])

	const handleSetEraser = (nextIsEraser: boolean) => {
		if (nextIsEraser) {
			if (brushColor !== '#ffffff') {
				previousColorRef.current = brushColor
			}
			setBrushColor('#ffffff')
			setIsEraser(true)
			return
		}

		if (brushColor === '#ffffff') {
			setBrushColor(previousColorRef.current)
		}

		setIsEraser(false)
	}

	useEffect(() => {
		if (!canvasRef.current || !wrapperRef.current) return

		const canvas = new Canvas(canvasRef.current, {
			width: wrapperRef.current.clientWidth,
			height: wrapperRef.current.clientHeight,
			isDrawingMode: true,
		})
		canvas.backgroundColor = '#ffffff'
		canvas.renderAll()

		canvas.freeDrawingBrush = new PencilBrush(canvas)
		canvas.freeDrawingBrush.color = INITIAL_BRUSH_COLOR
		canvas.freeDrawingBrush.width = INITIAL_BRUSH_SIZE

		const tempRef = { current: canvas } as React.RefObject<Canvas | null>
		setFabricRef(tempRef)

		const handleResize = () => {
			if (!wrapperRef.current) return
			canvas.setDimensions({
				width: wrapperRef.current.clientWidth,
				height: wrapperRef.current.clientHeight,
			})
			canvas.renderAll()
		}

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			canvas.dispose()
			setFabricRef({ current: null })
		}
	}, [setFabricRef])

	useEffect(() => {
		if (!fabricRef?.current?.freeDrawingBrush) return
		fabricRef.current.freeDrawingBrush.color = brushColor
		fabricRef.current.freeDrawingBrush.width = brushSize
	}, [brushColor, brushSize, fabricRef])

	useEffect(() => {
		if (!socket || !fabricRef?.current) return

		const handleAdded = (data: { object: unknown }) => {
			util.enlivenObjects([data.object]).then(objects => {
				objects.forEach(obj => {
					if (obj instanceof FabricObject) {
						fabricRef.current?.add(obj)
					}
				})
				fabricRef.current?.renderAll()
			})
		}

		const handleModified = (data: { object: unknown }) => {
			util.enlivenObjects([data.object]).then(objects => {
				objects.forEach(obj => {
					if (obj instanceof FabricObject) {
						fabricRef.current?.add(obj)
					}
				})
				fabricRef.current?.renderAll()
			})
		}

		socket.on('object:added_s', handleAdded)
		socket.on('object:modified_s', handleModified)

		return () => {
			socket.off('object:added_s', handleAdded)
			socket.off('object:modified_s', handleModified)
		}
	}, [socket, fabricRef])

	useEffect(() => {
		if (!fabricRef?.current || !socket) return
		const canvas = fabricRef.current

		const onPathCreated = (e: { path: FabricObject }) => {
			socket.emit('object:added', { roomKey, object: e.path.toJSON() })
		}

		const onObjectModified = (e: { target: FabricObject }) => {
			socket.emit('object:modified', { roomKey, object: e.target.toJSON() })
		}

		canvas.on('path:created', onPathCreated)
		canvas.on('object:modified', onObjectModified)

		return () => {
			canvas.off('path:created', onPathCreated)
			canvas.off('object:modified', onObjectModified)
		}
	}, [socket, roomKey, fabricRef])

	return (
		<div ref={wrapperRef} className='relative h-full w-full bg-slate-50'>
			<Toolbar
				brushColor={brushColor}
				setBrushColor={color => {
					setBrushColor(color)
					if (color !== '#ffffff') {
						previousColorRef.current = color
					}
				}}
				brushSize={brushSize}
				setBrushSize={setBrushSize}
				isEraser={isEraser}
				setIsEraser={handleSetEraser}
				onClear={() => {
					fabricRef?.current?.getObjects().forEach(obj => {
						fabricRef?.current?.remove(obj)
					})
					fabricRef?.current?.renderAll()
				}}
				isDrawingMode={isDrawingMode}
				setIsDrawingMode={setIsDrawingMode}
			/>
			<Zoom />
			<ViewportScroller />
			<canvas ref={canvasRef} className='h-full w-full' />
		</div>
	)
}
