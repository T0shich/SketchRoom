import type { TPointerEventInfo } from 'fabric'
import { Canvas, FabricImage, FabricObject, PencilBrush, util } from 'fabric'
import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import { useFabric } from '../../../store/useFabric'
import { usePasteImage } from '../hooks/usePasteImage'
import { Toolbar } from './Toolbar'
import { ViewportScroller } from './ViewportScroller'
import { Zoom } from './Zoom'

interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
}

type SocketObjectData = Record<string, unknown> & { socketObjectId?: string }

const INITIAL_BRUSH_COLOR = '#111827'
const INITIAL_BRUSH_SIZE = 3
const SOCKET_OBJECT_ID = 'socketObjectId'
const INITIAL_ERASER_SIZE = 20

const createSocketObjectId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const getSocketObjectId = (object: FabricObject | SocketObjectData | null | undefined) => {
	if (!object) return undefined
	if (object instanceof FabricObject) {
		const value = object.get(SOCKET_OBJECT_ID)
		return typeof value === 'string' ? value : undefined
	}

	const value = object[SOCKET_OBJECT_ID]
	return typeof value === 'string' ? value : undefined
}

const ensureSocketObjectId = (object: FabricObject) => {
	let objectId = getSocketObjectId(object)
	if (!objectId) {
		objectId = createSocketObjectId()
		object.set(SOCKET_OBJECT_ID, objectId)
	}
	return objectId
}

const serializeObject = (object: FabricObject) => {
	ensureSocketObjectId(object)
	return object.toObject([SOCKET_OBJECT_ID, 'globalCompositeOperation']) as SocketObjectData
}

const isIntersecting = (first: FabricObject, second: FabricObject) => {
	const firstRect = first.getBoundingRect()
	const secondRect = second.getBoundingRect()

	return !(
		firstRect.left + firstRect.width < secondRect.left ||
		secondRect.left + secondRect.width < firstRect.left ||
		firstRect.top + firstRect.height < secondRect.top ||
		secondRect.top + secondRect.height < firstRect.top
	)
}

export const DrawingCanvas = ({ socket, roomKey }: DrawingCanvasProps) => {
	const wrapperRef = useRef<HTMLDivElement>(null)
	const canvasHostRef = useRef<HTMLDivElement>(null)
	const fabricCanvasRef = useRef<Canvas | null>(null)
	const { setFabricRef } = useFabric()

	const [brushColor, setBrushColor] = useState(INITIAL_BRUSH_COLOR)
	const [brushSize, setBrushSize] = useState(INITIAL_BRUSH_SIZE)
	const [isEraser, setIsEraser] = useState(false)
	const [eraserSize, setEraserSize] = useState(INITIAL_ERASER_SIZE)
	const [isDrawingMode, setIsDrawingMode] = useState(true)
	const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null)

	usePasteImage({ socket, roomKey })


	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas?.freeDrawingBrush) return
		const brush = canvas.freeDrawingBrush as PencilBrush

		if (isEraser) {
			canvas.set({
				isDrawingMode: true,
				selection: false,
				defaultCursor: 'none',
				hoverCursor: 'none',
			})
			brush.color = '#000000'
			brush.width = eraserSize
			return
		}

		canvas.set({
			isDrawingMode,
			selection: true,
			defaultCursor: 'default',
			hoverCursor: 'move',
		})
		brush.color = brushColor
		brush.width = brushSize
	}, [brushColor, brushSize, eraserSize, isDrawingMode, isEraser])

	useEffect(() => {
		if (!canvasHostRef.current || !wrapperRef.current) return

		const host = canvasHostRef.current
		host.replaceChildren()
		const canvasElement = document.createElement('canvas')
		canvasElement.className = 'h-full w-full'
		host.appendChild(canvasElement)

		const canvas = new Canvas(canvasElement, {
			width: host.clientWidth,
			height: host.clientHeight,
			isDrawingMode: true,
		})
		canvas.backgroundColor = '#ffffff'
		canvas.renderAll()

		canvas.freeDrawingBrush = new PencilBrush(canvas)
		canvas.freeDrawingBrush.color = INITIAL_BRUSH_COLOR
		canvas.freeDrawingBrush.width = INITIAL_BRUSH_SIZE

		fabricCanvasRef.current = canvas
		const tempRef = { current: canvas } as React.RefObject<Canvas | null>
		setFabricRef(tempRef)

		const handleResize = () => {
			if (!canvasHostRef.current) return
			canvas.setDimensions({
				width: canvasHostRef.current.clientWidth,
				height: canvasHostRef.current.clientHeight,
			})
			canvas.renderAll()
		}

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			canvas.dispose()
			fabricCanvasRef.current = null
			host.replaceChildren()
			setFabricRef({ current: null })
		}
	}, [setFabricRef])

	// курсор ластика
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return
		if (!isEraser) return

		const onMouseMove = (opt: TPointerEventInfo) => {
			const canvasEl = canvas.upperCanvasEl ?? canvas.lowerCanvasEl
			if (!canvasEl) return
			const nativeEvent = opt.e
			if (!('clientX' in nativeEvent) || !('clientY' in nativeEvent)) return
			const rect = canvasEl.getBoundingClientRect()
			setEraserPos({
				x: nativeEvent.clientX - rect.left,
				y: nativeEvent.clientY - rect.top,
			})
		}

		const onMouseLeave = () => { setEraserPos(null) }

		canvas.on('mouse:move', onMouseMove)
		canvas.on('mouse:out', onMouseLeave)

		return () => {
			canvas.off('mouse:move', onMouseMove)
			canvas.off('mouse:out', onMouseLeave)
			setEraserPos(null)
		}
	}, [isEraser])

	useEffect(() => {
		if (!socket || !fabricCanvasRef.current) return

		const handleAdded = (data: { object: SocketObjectData }) => {
			if (!data?.object) return

			util.enlivenObjects([data.object]).then(objects => {
				const canvas = fabricCanvasRef.current
				if (!canvas) return

				objects.forEach(obj => {
					if (!(obj instanceof FabricObject)) return

					const incomingId = getSocketObjectId(obj) || ensureSocketObjectId(obj)
					if (incomingId) {
						const existing = canvas
							.getObjects()
							.find(existingObj => getSocketObjectId(existingObj) === incomingId)
						if (existing) return
					}

					canvas.add(obj)
				})
				canvas.renderAll()
			})
		}

		const handleModified = (data: { object: SocketObjectData }) => {
			if (!data?.object) return

			util.enlivenObjects([data.object]).then(objects => {
				const canvas = fabricCanvasRef.current
				if (!canvas) return

				objects.forEach(obj => {
					if (!(obj instanceof FabricObject)) return

					const incomingId = getSocketObjectId(obj)
					if (!incomingId) {
						return
					}

					const currentObjects = canvas.getObjects()
					const existingIndex = currentObjects.findIndex(
						existingObj => getSocketObjectId(existingObj) === incomingId,
					)

					if (existingIndex === -1) {
						canvas.add(obj)
						return
					}

					canvas.remove(currentObjects[existingIndex])
					canvas.insertAt(existingIndex, obj)
				})
				canvas.renderAll()
			})
		}

		const handleClear = () => {
			const canvas = fabricCanvasRef.current
			if (!canvas) return

			canvas.getObjects().forEach(obj => canvas.remove(obj))
			canvas.renderAll()
		}

		socket.on('object:added_s', handleAdded)
		socket.on('object:modified_s', handleModified)
		socket.on('canvas:clear_s', handleClear)

		return () => {
			socket.off('object:added_s', handleAdded)
			socket.off('object:modified_s', handleModified)
			socket.off('canvas:clear_s', handleClear)
		}
	}, [socket])

	// обработка удалений от других участников
	useEffect(() => {
		if (!socket || !fabricCanvasRef.current) return

		const handleRemoved = (data: { objectId: string }) => {
			const canvas = fabricCanvasRef.current
			if (!canvas) return
			const obj = canvas.getObjects().find(o => getSocketObjectId(o) === data.objectId)
			if (!obj) return
			canvas.remove(obj)
			canvas.renderAll()
		}

		socket.on('object:removed_s', handleRemoved)
		return () => { socket.off('object:removed_s', handleRemoved) }
	}, [socket])

	useEffect(() => {
		if (!fabricCanvasRef.current || !socket) return
		const canvas = fabricCanvasRef.current

		const bakeEraserIntoObject = async (target: FabricObject, eraserPath: FabricObject) => {
			const targetId = ensureSocketObjectId(target)
			const targetBounds = target.getBoundingRect()
			const sourceCanvas = target.toCanvasElement()

			const padding = 2
			const resultCanvas = document.createElement('canvas')
			resultCanvas.width = Math.max(1, Math.ceil(targetBounds.width + padding * 2))
			resultCanvas.height = Math.max(1, Math.ceil(targetBounds.height + padding * 2))
			const ctx = resultCanvas.getContext('2d')
			if (!ctx) return

			ctx.drawImage(sourceCanvas, padding, padding)
			ctx.save()
			ctx.globalCompositeOperation = 'destination-out'
			ctx.translate(-targetBounds.left + padding, -targetBounds.top + padding)
			eraserPath.render(ctx)
			ctx.restore()

			const imageUrl = resultCanvas.toDataURL('image/png')
			const erasedImage = await FabricImage.fromURL(imageUrl, {}, {
				left: targetBounds.left - padding,
				top: targetBounds.top - padding,
				originX: 'left',
				originY: 'top',
				selectable: target.selectable,
				evented: target.evented,
			})

			erasedImage.set(SOCKET_OBJECT_ID, targetId)

			const targetIndex = canvas.getObjects().indexOf(target)
			canvas.remove(target)
			if (targetIndex >= 0) {
				canvas.insertAt(targetIndex, erasedImage)
			} else {
				canvas.add(erasedImage)
			}

			socket.emit('object:modified', {
				roomKey,
				object: serializeObject(erasedImage),
			})
		}

		const onPathCreated = (e: { path: FabricObject }) => {
			if (isEraser) {
				e.path.set({
					globalCompositeOperation: 'destination-out',
					selectable: false,
					evented: false,
				})

				const targets = canvas
					.getObjects()
					.filter(object => object !== e.path)
					.filter(object => isIntersecting(object, e.path))

				void (async () => {
					for (const target of targets) {
						await bakeEraserIntoObject(target, e.path)
					}

					canvas.remove(e.path)
					canvas.renderAll()
				})()

				return
			}

			socket.emit('object:added', { roomKey, object: serializeObject(e.path) })
		}

		const onObjectModified = (e: { target: FabricObject }) => {
			const target = e.target
			if (!target) return

			const maybeSelection = target as FabricObject & { getObjects?: () => FabricObject[] }
			if (target.type === 'activeSelection' && typeof maybeSelection.getObjects === 'function') {
				maybeSelection.getObjects().forEach(obj => {
					socket.emit('object:modified', { roomKey, object: serializeObject(obj) })
				})
				return
			}

			socket.emit('object:modified', { roomKey, object: serializeObject(target) })
		}

		canvas.on('path:created', onPathCreated)
		canvas.on('object:modified', onObjectModified)

		return () => {
			canvas.off('path:created', onPathCreated)
			canvas.off('object:modified', onObjectModified)
		}
	}, [socket, roomKey, isEraser])

	return (
		<div ref={wrapperRef} className='relative h-full w-full bg-slate-50'>
			<Toolbar
				brushColor={brushColor}
				setBrushColor={color => {
					setBrushColor(color)
				}}
				brushSize={brushSize}
				setBrushSize={setBrushSize}
				isEraser={isEraser}
				setIsEraser={setIsEraser}
				eraserSize={eraserSize}
				setEraserSize={setEraserSize}
				onClear={() => {
					fabricCanvasRef.current?.getObjects().forEach(obj => {
						fabricCanvasRef.current?.remove(obj)
					})
					fabricCanvasRef.current?.renderAll()
					if (socket) {
						socket.emit('canvas:clear', { roomKey })
					}
				}}
				isDrawingMode={isDrawingMode}
				setIsDrawingMode={setIsDrawingMode}
			/>
			<Zoom />
			<ViewportScroller />
			{isEraser && eraserPos && (
				<div
					className='pointer-events-none absolute z-30 rounded-full border-2 border-slate-900 bg-white/30'
					style={{
						width: eraserSize,
						height: eraserSize,
						left: eraserPos.x - eraserSize / 2,
						top: eraserPos.y - eraserSize / 2,
					}}
				/>
			)}
			<div ref={canvasHostRef} className='h-full w-full' />
		</div>
	)
}
