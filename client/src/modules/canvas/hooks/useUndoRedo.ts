import type { FabricObject, Path, TPointerEventInfo } from 'fabric'
import { useEffect } from 'react'
import { useFabric } from '../../../store/useFabric'
import { UndoRedo } from '../Tools/UndoRedo'

export const useUndoRedo = () => {
	const { fabricRef: fabricCanvasRef } = useFabric()
	const { undo, redo, pushAction } = UndoRedo(
		fabricCanvasRef || { current: null },
	)

	useEffect(() => {
		const canvas = fabricCanvasRef?.current
		if (!canvas) return

		const handleAction = (
			options: TPointerEventInfo & {
				target: FabricObject
				transform?: { original: Partial<FabricObject> }
			},
		) => {
			const target = options.target
			if (!target) return

			pushAction({
				type: 'MODIFY',
				target,
				oldProps: options.transform?.original || {},
				newProps: target.toObject() as Partial<FabricObject>,
			})
		}

		const handlePathCreated = (options: { path: Path }) => {
			if (options.path) {
				pushAction({ type: 'ADD', target: options.path })
			}
		}

		canvas.on('object:modified', handleAction)
		canvas.on('path:created', handlePathCreated)

		return () => {
			canvas.off('object:modified', handleAction)
			canvas.off('path:created', handlePathCreated)
		}
	}, [fabricCanvasRef, pushAction])

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isZ = e.key === 'z' || e.key === 'Z'  || e.key === 'я' || e.key === 'Я' 
			const isCtrl = e.ctrlKey || e.metaKey

			if (isCtrl && isZ && e.shiftKey) {
				e.preventDefault()
				redo()
			} else if (isCtrl && isZ) {
				e.preventDefault()
				undo()
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [undo, redo])
}
