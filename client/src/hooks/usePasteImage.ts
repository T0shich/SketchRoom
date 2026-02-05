import { useEffect, type RefObject } from 'react'
import { Canvas, FabricImage } from 'fabric'

interface Props {
	fabricRef: RefObject<Canvas | null>
}

export const usePasteImage = ({ fabricRef }: Props) => {
	useEffect(() => {
		const handlePaste = (e: ClipboardEvent) => {
			const fabricCanvas = fabricRef.current
			if (!fabricCanvas) return
			const items = e.clipboardData?.items
			if (!items) return

			for (const item of items) {
				if (item.type.startsWith('image/')) {
					const blob = item.getAsFile()
					console.log(blob)
					if (!blob) continue

					const objectUrl = URL.createObjectURL(blob)

					const img = new Image()

					img.onload = () => {
						const fabricImg = new FabricImage(img, {
							left: fabricCanvas.width! / 2,
							top: fabricCanvas.height! / 2,

							hasControls: true, 
							hasBorders: true, 
							lockMovementX: false,
							lockMovementY: false, // заблокировать перемещение по Y
							lockRotation: false, // заблокировать поворот
							lockScalingX: false, // заблокировать масштаб по X
							lockScalingY: false,
							originX: 'center',
							originY: 'center',
						})
						fabricCanvas.add(fabricImg)
						fabricCanvas.setActiveObject(fabricImg)
						fabricCanvas.renderAll()
						URL.revokeObjectURL(objectUrl)
					}
					console.log(`URL: ${objectUrl}`)

					img.onerror = err => {
						console.error('Ошибка загрузки изображения:', err)
						URL.revokeObjectURL(objectUrl)
					}

					img.src = objectUrl
				}
			}
		}

		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [fabricRef])
}
