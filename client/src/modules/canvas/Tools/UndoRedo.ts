import type { Canvas, FabricObject } from 'fabric'
import { useCallback, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { getSocketObjectId, serializeObject } from '../Socket/FabrickObjects'

// Типы действий
type Action =
	| { type: 'ADD'; target: FabricObject }
	| { type: 'REMOVE'; target: FabricObject }
	| {
			type: 'MODIFY'
			target: FabricObject
			oldProps: Partial<FabricObject>
			newProps: Partial<FabricObject>
	  }
	| { type: 'CLEAR'; targets: FabricObject[] }

export const UndoRedo = (
	fabricCanvasRef: React.RefObject<Canvas | null>,
	socket?: Socket | null,
	roomKey?: string,
) => {
	const [history, setHistory] = useState<Action[]>([])
	const [currentIndex, setCurrentIndex] = useState(-1)

	const pushAction = useCallback(
		(action: Action) => {
			setHistory(prev => {
				const newHistory = prev.slice(0, currentIndex + 1)
				return [...newHistory, action]
			})
			setCurrentIndex(prev => prev + 1)
		},
		[currentIndex],
	)

	const undo = useCallback(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || currentIndex < 0) return

		const action = history[currentIndex]

		switch (action.type) {
			case 'ADD':
				canvas.remove(action.target)
				// notify others: object removed
				try {
					const objectId = getSocketObjectId(action.target)
					if (socket && roomKey && objectId) {
						socket.emit('object:removed', { roomKey, objectId })
					}
				} catch (e) {
					// ignore
				}
				break
			case 'REMOVE':
				canvas.add(action.target)
				// notify others: object added
				try {
					if (socket && roomKey) {
						socket.emit('object:added', {
							roomKey,
							object: serializeObject(action.target),
						})
					}
				} catch (e) {
					// ignore
				}
				break
			case 'MODIFY':
				action.target.set(action.oldProps)
				action.target.setCoords()
				// notify others: modified
				try {
					if (socket && roomKey) {
						socket.emit('object:modified', {
							roomKey,
							object: serializeObject(action.target),
						})
					}
				} catch (e) {
					// ignore
				}
				break
			case 'CLEAR':
				action.targets.forEach(obj => canvas.add(obj))
				// notify others: re-add objects
				try {
					if (socket && roomKey) {
						action.targets.forEach(obj => {
							socket.emit('object:added', {
								roomKey,
								object: serializeObject(obj),
							})
						})
					}
				} catch (e) {
					// ignore
				}
				break
		}

		canvas.renderAll()
		setCurrentIndex(currentIndex - 1)
	}, [currentIndex, history, fabricCanvasRef, socket, roomKey])

	const redo = useCallback(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || currentIndex >= history.length - 1) return

		const action = history[currentIndex + 1]

		switch (action.type) {
			case 'ADD':
				canvas.add(action.target)
				// notify others: object added
				try {
					if (socket && roomKey) {
						socket.emit('object:added', {
							roomKey,
							object: serializeObject(action.target),
						})
					}
				} catch (e) {
					// ignore
				}
				break
			case 'REMOVE':
				canvas.remove(action.target)
				// notify others: object removed
				try {
					const objectId = getSocketObjectId(action.target)
					if (socket && roomKey && objectId) {
						socket.emit('object:removed', { roomKey, objectId })
					}
				} catch (e) {
					// ignore
				}
				break
			case 'MODIFY':
				action.target.set(action.newProps)
				action.target.setCoords()
				// notify others: modified
				try {
					if (socket && roomKey) {
						socket.emit('object:modified', {
							roomKey,
							object: serializeObject(action.target),
						})
					}
				} catch (e) {
					// ignore
				}
				break
			case 'CLEAR':
				// Повторная очистка
				action.targets.forEach(obj => canvas.remove(obj))
				// notify others: clear canvas
				try {
					if (socket && roomKey) {
						socket.emit('canvas:clear', { roomKey })
					}
				} catch (e) {
					// ignore
				}
				break
		}

		canvas.renderAll()
		setCurrentIndex(currentIndex + 1)
	}, [currentIndex, history, fabricCanvasRef, socket, roomKey])

	return {
		undo,
		redo,
		pushAction,
		canUndo: currentIndex >= 0,
		canRedo: currentIndex < history.length - 1,
	}
}
