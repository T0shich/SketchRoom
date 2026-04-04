import type { TPointerEventInfo } from 'fabric'
import { Canvas, FabricImage, FabricObject, PencilBrush } from 'fabric'
import { useEffect, useRef, useState } from 'react'
import { Socket } from 'socket.io-client'
import type { CanvasSnapshot } from '../../../store/BoardAPI'
import { useFabric } from '../../../store/useFabric'
import { usePasteImage } from '../hooks/usePasteImage'
import { ensureSocketObjectId, isIntersecting, serializeObject } from '../Socket/FabrickObjects'
import { useSocketEvents } from '../Socket/useSocketEvents'
import { useDrawingModes } from '../Tools/useDrawingModes'
import { useTextMode } from '../Tools/useTextMode'
import { Toolbar } from './Toolbar'
import { ViewportScroller } from './ViewportScroller'
import { Zoom } from './Zoom'
interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
	initialSnapshot?: CanvasSnapshot | null
}



const INITIAL_BRUSH_COLOR = '#111827'
const INITIAL_BRUSH_SIZE = 3
const SOCKET_OBJECT_ID = 'socketObjectId'
const INITIAL_ERASER_SIZE = 20

// Генерирует уникальный идентификатор объекта для синхронизации через сокет.


export const DrawingCanvas = ({ socket, roomKey, initialSnapshot = null }: DrawingCanvasProps) => {
	const wrapperRef = useRef<HTMLDivElement>(null)
	const canvasHostRef = useRef<HTMLDivElement>(null)
	const fabricCanvasRef = useRef<Canvas | null>(null)
	const snapshotLoadedRef = useRef(false)
	const { setFabricRef } = useFabric()

	const [brushColor, setBrushColor] = useState(INITIAL_BRUSH_COLOR)
	const [brushSize, setBrushSize] = useState(INITIAL_BRUSH_SIZE)
	const [isEraser, setIsEraser] = useState(false)
	const [textMode, setTextMode] = useState(false)
	const [eraserSize, setEraserSize] = useState(INITIAL_ERASER_SIZE)
	const [isDrawingMode, setIsDrawingMode] = useState(true)
	const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null)

	usePasteImage({ socket, roomKey })

	// Сбрасывает флаг загрузки снапшота при смене комнаты.
	useEffect(() => {
		snapshotLoadedRef.current = false
	}, [roomKey])

	// Инициализирует Fabric canvas, базовую кисть и обработчик ресайза окна.
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

		// Актуализирует размеры канваса под размер контейнера.
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

	useTextMode({
		textMode,
		setTextMode,
		canvasRef: fabricCanvasRef,
		brushColor,
		onTextCommitted: textObject => {
			if (socket) {
				socket.emit('object:added', {
					roomKey,
					object: serializeObject(textObject),
				})
			}
		},
	})

	useDrawingModes({
		brushColor,
		brushSize,
		eraserSize,
		isEraser,
		isDrawingMode,
		textMode,
		fabricCanvasRef,
	})

	useSocketEvents({ fabricCanvasRef, socket })

	// Загружает начальный снимок холста и восстанавливает viewport один раз на комнату.
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || !initialSnapshot || snapshotLoadedRef.current) return

		snapshotLoadedRef.current = true

		void canvas.loadFromJSON(initialSnapshot).then(() => {
			if (
				typeof initialSnapshot.scaleX === 'number' &&
				typeof initialSnapshot.scaleY === 'number' &&
				typeof initialSnapshot.left === 'number' &&
				typeof initialSnapshot.top === 'number'
			) {
				canvas.setViewportTransform([
					initialSnapshot.scaleX,
					0,
					0,
					initialSnapshot.scaleY,
					initialSnapshot.left,
					initialSnapshot.top,
				])
			}

			canvas.renderAll()
		})
	}, [initialSnapshot, roomKey])

	// Отрисовывает визуальный курсор ластика и обновляет его позицию по движению мыши.
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas) return
		if (!isEraser) return

		// Обновляет координаты курсора ластика относительно canvas.
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

		// Прячет курсор ластика при уходе мыши за пределы canvas.
		const onMouseLeave = () => { setEraserPos(null) }

		canvas.on('mouse:move', onMouseMove)
		canvas.on('mouse:out', onMouseLeave)

		return () => {
			canvas.off('mouse:move', onMouseMove)
			canvas.off('mouse:out', onMouseLeave)
			setEraserPos(null)
		}
	}, [isEraser])

	// Подписывается на сокет-события добавления/изменения/очистки объектов от других участников.


	// Отправляет локальные изменения рисования/перемещения в сокет и обрабатывает ластик как вырезание.
	useEffect(() => {
		if (!fabricCanvasRef.current || !socket) return
		const canvas = fabricCanvasRef.current

		// Применяет путь ластика к объекту и заменяет его на результирующее изображение.
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

		// Обрабатывает завершение рисования пути: обычный штрих или стирание.
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

		// Отправляет изменения объекта после перемещения/трансформации.
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
				textMode={textMode}
				setTextMode={setTextMode}
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
