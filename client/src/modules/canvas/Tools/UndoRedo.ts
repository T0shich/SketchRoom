import type { Canvas, FabricObject } from 'fabric'
import { useCallback, useState } from 'react'

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

export const UndoRedo = (fabricCanvasRef: React.RefObject<Canvas | null>) => {
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
				break
			case 'REMOVE':
				canvas.add(action.target)
				break
			case 'MODIFY':
				action.target.set(action.oldProps)
				action.target.setCoords() 
				break
			case 'CLEAR':
				action.targets.forEach(obj => canvas.add(obj))
				break
		}

		canvas.renderAll()
		setCurrentIndex(currentIndex - 1)
	}, [currentIndex, history, fabricCanvasRef])

	const redo = useCallback(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || currentIndex >= history.length - 1) return

		const action = history[currentIndex + 1]

		switch (action.type) {
			case 'ADD':
				canvas.add(action.target)
				break
			case 'REMOVE':
				canvas.remove(action.target)
				break
			case 'MODIFY':
				action.target.set(action.newProps)
				action.target.setCoords()
				break
			case 'CLEAR':
				// Повторная очистка
				action.targets.forEach(obj => canvas.remove(obj))
				break
		}

		canvas.renderAll()
		setCurrentIndex(currentIndex + 1)
	}, [currentIndex, history, fabricCanvasRef])

	return {
		undo,
		redo,
		pushAction,
		canUndo: currentIndex >= 0,
		canRedo: currentIndex < history.length - 1,
	}
}
