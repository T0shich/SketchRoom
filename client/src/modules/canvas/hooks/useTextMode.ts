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
	textSize: number
	onTextCommitted?: (text: FabricObject) => void
}

export const useTextMode = ({
	textMode,
	setTextMode,
	canvasRef,
	brushColor,
	textSize,
	onTextCommitted,
}: TextModeProps) => {
	useEffect(() => {
		const canvas = canvasRef.current
		if (!textMode || !canvas) return

		const onMouseDown = (opt: TPointerEventInfo) => {
			const target = opt.target
			if (target instanceof IText) {
				canvas.setActiveObject(target)
				target.enterEditing()
				target.selectAll()
				canvas.renderAll()
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
				fontSize: textSize,
			})

			canvas.add(interactiveText)
			canvas.setActiveObject(interactiveText)
			interactiveText.enterEditing()
			interactiveText.selectAll()
			canvas.renderAll()
		}

		const onTextEditingExited = (opt: { target: FabricObject }) => {
			const target = opt.target
			if (!(target instanceof IText)) return

			if (target.text && target.text.trim().length > 0) {
				onTextCommitted?.(target)
			} else {
				canvas.remove(target)
				canvas.renderAll()
			}
		}

		canvas.on('mouse:down', onMouseDown)
		canvas.on('text:editing:exited', onTextEditingExited)

		return () => {
			canvas.off('mouse:down', onMouseDown)
			canvas.off('text:editing:exited', onTextEditingExited)
		}
	}, [textMode, setTextMode, canvasRef, brushColor, onTextCommitted])
}
