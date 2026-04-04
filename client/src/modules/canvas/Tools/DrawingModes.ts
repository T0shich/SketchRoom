import { Canvas, PencilBrush } from 'fabric'
import { useEffect, type RefObject } from 'react'

interface DrawingModesProps {
	brushColor: string
	brushSize: number
	eraserSize: number
	isEraser: boolean
	isDrawingMode: boolean
	textMode: boolean
	fabricCanvasRef: RefObject<Canvas | null>
}

export const DrawingModes = ({
	brushColor,
	brushSize,
	eraserSize,
	isEraser,
	isDrawingMode,
	textMode,
	fabricCanvasRef,
}: DrawingModesProps) => {
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

		if (textMode) {
			canvas.set({
				isDrawingMode: false,
				selection: false,
				defaultCursor: 'text',
				hoverCursor: 'text',
			})
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
	}, [
		brushColor,
		brushSize,
		eraserSize,
		isDrawingMode,
		isEraser,
		textMode,
		fabricCanvasRef,
	])

	return null
}
