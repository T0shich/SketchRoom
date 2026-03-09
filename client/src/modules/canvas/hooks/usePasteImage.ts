import { FabricImage } from 'fabric'
import { useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { useFabric } from '../../../store/useFabric'

interface Props {
	socket: Socket | null
	roomKey: string
}

const createSocketObjectId = () =>
	`${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const usePasteImage = ({ socket, roomKey }: Props) => {
	const fabricRef = useFabric(state => state.fabricRef)

	useEffect(() => {
		const handlePaste = async (e: ClipboardEvent) => {
			if (!fabricRef?.current) return
			const fabricCanvas = fabricRef.current

			const items = e.clipboardData?.items
			if (!items) return

			for (const item of items) {
				if (!item.type.startsWith('image/')) continue

				const blob = item.getAsFile()
				if (!blob) continue

				const reader = new FileReader()
				reader.onload = async () => {
					const dataUrl = reader.result as string

					try {
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

						fabricImg.set('socketObjectId', createSocketObjectId())
						fabricCanvas.add(fabricImg)
						fabricCanvas.setActiveObject(fabricImg)
						fabricCanvas.renderAll()

						if (socket) {
							const serialized = fabricImg.toObject() as unknown as Record<
								string,
								unknown
							>
							serialized.socketObjectId = fabricImg.get('socketObjectId')

							socket.emit('object:added', {
								roomKey,
								object: serialized,
							})
						}
					} catch (err) {
						console.error('Ошибка создания изображения:', err)
					}
				}

				reader.readAsDataURL(blob)
			}
		}

		document.addEventListener('paste', handlePaste)
		return () => document.removeEventListener('paste', handlePaste)
	}, [fabricRef, socket, roomKey])
}
