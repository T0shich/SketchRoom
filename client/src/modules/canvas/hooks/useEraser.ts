import type { TPointerEventInfo } from 'fabric'
import { Canvas, FabricImage, FabricObject } from 'fabric'
import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import {
	ensureSocketObjectId,
	isIntersecting,
	serializeObject,
} from '../Socket/FabrickObjects'

interface UseEraserProps {
	fabricCanvasRef: React.RefObject<Canvas | null>
	socket: Socket | null
	roomKey: string
	isEraser: boolean
}

const SOCKET_OBJECT_ID = 'socketObjectId'

export const useEraser = ({
	fabricCanvasRef,
	socket,
	roomKey,
	isEraser,
}: UseEraserProps) => {
	const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(
		null,
	)

	// Сбрасываем позицию ластика, если режим выключен
	if (!isEraser && eraserPos !== null) {
		setEraserPos(null)
	}

	// Отрисовывает визуальный курсор ластика и обновляет его позицию по движению мыши.
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || !isEraser) {
			return
		}

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

		const onMouseLeave = () => {
			setEraserPos(null)
		}

		canvas.on('mouse:move', onMouseMove)
		canvas.on('mouse:out', onMouseLeave)

		return () => {
			canvas.off('mouse:move', onMouseMove)
			canvas.off('mouse:out', onMouseLeave)
			setEraserPos(null)
		}
	}, [isEraser, fabricCanvasRef])

	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || !socket) return

		
		const bakeEraserIntoObject = async (
			target: FabricObject,
			eraserPath: FabricObject,
		) => {
			const targetId = ensureSocketObjectId(target)
			const targetBounds = target.getBoundingRect()
			const sourceCanvas = target.toCanvasElement()

			const padding = 2
			const resultCanvas = document.createElement('canvas')
			resultCanvas.width = Math.max(
				1,
				Math.ceil(targetBounds.width + padding * 2),
			)
			resultCanvas.height = Math.max(
				1,
				Math.ceil(targetBounds.height + padding * 2),
			)
			const ctx = resultCanvas.getContext('2d')
			if (!ctx) return

			ctx.drawImage(sourceCanvas, padding, padding)
			ctx.save()
			ctx.globalCompositeOperation = 'destination-out'
			ctx.translate(-targetBounds.left + padding, -targetBounds.top + padding)
			eraserPath.render(ctx)
			ctx.restore()

			const imageUrl = resultCanvas.toDataURL('image/png')
			const erasedImage = await FabricImage.fromURL(
				imageUrl,
				{},
				{
					left: targetBounds.left - padding,
					top: targetBounds.top - padding,
					originX: 'left',
					originY: 'top',
					selectable: target.selectable,
					evented: target.evented,
				},
			)

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
			if (!isEraser) return

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
		}

		canvas.on('path:created', onPathCreated)

		return () => {
			canvas.off('path:created', onPathCreated)
		}
	}, [socket, roomKey, isEraser, fabricCanvasRef])

	return { eraserPos }
}
