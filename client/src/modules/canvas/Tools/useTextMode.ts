import {
	Canvas,
	IText,
	type FabricObject,
	type TPointerEventInfo,
} from 'fabric'
import type { RefObject } from 'react'
import { useEffect } from 'react'

interface TextModeProps {
	textMode: boolean
	setTextMode: (textMode: boolean) => void
	canvasRef: RefObject<Canvas | null>
	brushColor: string
	onTextCommitted?: (text: FabricObject) => void
}

export const useTextMode = ({
	textMode,
	setTextMode,
	canvasRef,
	brushColor,
	onTextCommitted,
}: TextModeProps) => {
	useEffect(() => {
		const canvas = canvasRef.current
		if (!textMode || !canvas) return

		const registerCommit = (textObject: IText) => {
			textObject.once('editing:exited', () => {
				if (!canvasRef.current) return

				if (!textObject.text?.trim()) {
					canvasRef.current.remove(textObject)
					canvasRef.current.renderAll()
					return
				}

				onTextCommitted?.(textObject)
			})
		}

		const onMouseDown = (opt: TPointerEventInfo) => {
			const target = opt.target
			if (target instanceof IText) {
				canvas.setActiveObject(target)
				registerCommit(target)
				target.enterEditing()
				target.selectAll()
				canvas.renderAll()
				setTextMode(false)
				return
			}

			if (target) return

			const point = canvas.getScenePoint(opt.e)
			const interactiveText = new IText('', {
				left: point.x,
				top: point.y,
				fontFamily: 'Helvetica',
				fontWeight: 'bold',
				fill: brushColor,
				fontSize: 32,
			})

			canvas.add(interactiveText)
			canvas.setActiveObject(interactiveText)
			registerCommit(interactiveText)
			interactiveText.enterEditing()
			interactiveText.selectAll()
			canvas.renderAll()
			setTextMode(false)
		}

		canvas.on('mouse:down', onMouseDown)
		return () => {
			canvas.off('mouse:down', onMouseDown)
		}
	}, [textMode, setTextMode, canvasRef, brushColor, onTextCommitted])
}
