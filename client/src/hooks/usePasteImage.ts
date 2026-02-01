import { useEffect, type RefObject } from 'react'

interface Props {
    canvasRef: RefObject<HTMLCanvasElement | null>  
}
export const usePastImage = ({ canvasRef }: Props) => {
	useEffect(() => {
		const canvas = canvasRef.current
		if(!canvas) return
		const handlePaste = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items
			if (!items) return

			for (const item of items) {
				if (item.type.startsWith('image/')) {
					const blob = item.getAsFile()
					if (!blob) return

					const img = new Image()
					img.onload = () => {
						const ctx = canvas.getContext('2d')
						ctx?.drawImage(img, 0, 0)
						URL.revokeObjectURL(img.src)
					}
					img.src = URL.createObjectURL(blob)
				}
			}
		}
		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [canvasRef])
}
