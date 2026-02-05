import { useEffect, type RefObject } from 'react'
import { Canvas, FabricImage } from 'fabric'
import { Socket } from 'socket.io-client'

interface Props {
	fabricRef: RefObject<Canvas | null>
	socket: Socket | null
	roomKey: string
}

export const usePasteImage = ({ fabricRef, socket, roomKey }: Props) => {
	useEffect(() => {
		const handlePaste = async (e: ClipboardEvent) => {
			const fabricCanvas = fabricRef.current
			if (!fabricCanvas) return

			const items = e.clipboardData?.items
			if (!items) return

			for (const item of items) {
				if (item.type.startsWith('image/')) {
					const blob = item.getAsFile()
					if (!blob) continue

					const reader = new FileReader()
					reader.onload = async () => {
						const dataUrl = reader.result as string

						try {
							// Используем fromURL для создания FabricImage
							const fabricImg = await FabricImage.fromURL(
								dataUrl,
								{
									crossOrigin: 'anonymous',
								},
								{
									left: fabricCanvas.width! / 2,
									top: fabricCanvas.height! / 2,
									originX: 'center',
									originY: 'center',
								},
							)

							fabricCanvas.add(fabricImg)
							fabricCanvas.setActiveObject(fabricImg)
							fabricCanvas.renderAll()

							// Отправляем на сервер
							if (socket) {
								socket.emit('object:added', {
									roomKey,
									object: fabricImg.toObject(),
								})
								console.log('=== ОТПРАВКА ===')
								console.log('roomKey:', roomKey)
								console.log('object type:', fabricImg.type)
								console.log('object src:', fabricImg.getSrc?.() || 'нет src')
								console.log('object:', fabricImg.toObject())
							}
						} catch (err) {
							console.error('Ошибка создания изображения:', err)
						}
					}

					reader.readAsDataURL(blob)
				}
			}
		}

		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [fabricRef, socket, roomKey])
}
