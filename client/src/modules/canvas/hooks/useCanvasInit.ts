import { Canvas, PencilBrush } from 'fabric'
import { useEffect, useRef } from 'react'
import { useFabric } from '../../../store/useFabric'

interface UseCanvasInitProps {
	roomKey: string
	initialBrushColor: string
	initialBrushSize: number
}

export const useCanvasInit = ({
	roomKey,
	initialBrushColor,
	initialBrushSize,
}: UseCanvasInitProps) => {
	const canvasHostRef = useRef<HTMLDivElement>(null)
	const fabricCanvasRef = useRef<Canvas | null>(null)
	const snapshotLoadedRef = useRef(false)
	const { setFabricRef } = useFabric()

	useEffect(() => {
		snapshotLoadedRef.current = false
	}, [roomKey])

	useEffect(() => {
		if (!canvasHostRef.current) return

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
		try {
			canvas.renderAll()
		} catch (error) {
			console.warn('Initial renderAll failed:', error)
		}

		canvas.freeDrawingBrush = new PencilBrush(canvas)
		canvas.freeDrawingBrush.color = initialBrushColor
		canvas.freeDrawingBrush.width = initialBrushSize

		fabricCanvasRef.current = canvas
		const tempRef = { current: canvas } as React.RefObject<Canvas | null>
		setFabricRef(tempRef)

		const handleResize = () => {
			if (!canvasHostRef.current) return
			try {
				canvas.setDimensions({
					width: canvasHostRef.current.clientWidth,
					height: canvasHostRef.current.clientHeight,
				})
				canvas.renderAll()
			} catch (error) {
				console.warn('Resize renderAll failed:', error)
			}
		}

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
			canvas.dispose()
			fabricCanvasRef.current = null
			host.replaceChildren()
			setFabricRef({ current: null })
		}
	}, [setFabricRef, initialBrushColor, initialBrushSize])

	return {
		canvasHostRef,
		fabricCanvasRef,
		snapshotLoadedRef,
	}
}
