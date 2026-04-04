import { Canvas, FabricObject, util } from 'fabric'
import { useEffect, type RefObject } from 'react'
import { Socket } from 'socket.io-client'
import { ensureSocketObjectId, getSocketObjectId } from './FabrickObjects'
interface SocketEventsProps {
	fabricCanvasRef: RefObject<Canvas | null>
	socket: Socket | null
}

type SocketObjectData = Record<string, unknown> & { socketObjectId?: string }

export const useSocketEvents = ({
	fabricCanvasRef,
	socket,
}: SocketEventsProps) => {
	useEffect(() => {
		if (!socket || !fabricCanvasRef.current) return

		// Добавляет полученный по сокету объект, если его ещё нет на канвасе.
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
							.find(
								existingObj => getSocketObjectId(existingObj) === incomingId,
							)
						if (existing) return
					}

					canvas.add(obj)
				})
				canvas.renderAll()
			})
		}

		// Обновляет существующий объект по socketObjectId или добавляет, если он отсутствует.
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

		// Очищает холст по событию очистки от других участников.
		const handleClear = () => {
			const canvas = fabricCanvasRef.current
			if (!canvas) return

			canvas.getObjects().forEach(obj => canvas.remove(obj))
			canvas.renderAll()
		}

		const handleRemoved = (data: { objectId: string }) => {
			const canvas = fabricCanvasRef.current
			if (!canvas) return
			const obj = canvas
				.getObjects()
				.find(o => getSocketObjectId(o) === data.objectId)
			if (!obj) return
			canvas.remove(obj)
			canvas.renderAll()
		}

		socket.on('object:added_s', handleAdded)
		socket.on('object:modified_s', handleModified)
		socket.on('canvas:clear_s', handleClear)
		socket.on('object:removed_s', handleRemoved)

		return () => {
			socket.off('object:removed_s', handleRemoved)
			socket.off('object:added_s', handleAdded)
			socket.off('object:modified_s', handleModified)
			socket.off('canvas:clear_s', handleClear)
		}
	}, [socket, fabricCanvasRef])
}
