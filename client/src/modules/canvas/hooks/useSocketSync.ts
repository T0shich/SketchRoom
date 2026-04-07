import { Canvas, FabricObject } from 'fabric'
import { useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { serializeObject } from '../Socket/FabrickObjects'

interface UseSocketSyncProps {
	fabricCanvasRef: React.RefObject<Canvas | null>
	socket: Socket | null
	roomKey: string
	isEraser: boolean
}

export const useSocketSync = ({
	fabricCanvasRef,
	socket,
	roomKey,
	isEraser,
}: UseSocketSyncProps) => {
	useEffect(() => {
		if (!fabricCanvasRef.current || !socket) return
		const canvas = fabricCanvasRef.current

		const onPathCreated = (e: { path: FabricObject }) => {
			if (isEraser) return
			socket.emit('object:added', { roomKey, object: serializeObject(e.path) })
		}

		const onObjectModified = (e: { target: FabricObject }) => {
			const target = e.target
			if (!target) return

			const maybeSelection = target as FabricObject & {
				getObjects?: () => FabricObject[]
			}
			if (
				target.type === 'activeSelection' &&
				typeof maybeSelection.getObjects === 'function'
			) {
				maybeSelection.getObjects().forEach(obj => {
					socket.emit('object:modified', {
						roomKey,
						object: serializeObject(obj),
					})
				})
				return
			}

			socket.emit('object:modified', {
				roomKey,
				object: serializeObject(target),
			})
		}

		canvas.on('path:created', onPathCreated)
		canvas.on('object:modified', onObjectModified)

		return () => {
			canvas.off('path:created', onPathCreated)
			canvas.off('object:modified', onObjectModified)
		}
	}, [socket, roomKey, isEraser, fabricCanvasRef])
}
