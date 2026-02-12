import { Point } from 'fabric'
import { useEffect, useState } from 'react'
import { useFabric } from '../../../store/useFabric'

export const Zoom = () => {
	const [zoom, setZoom] = useState(1)
	const fabricRef = useFabric(state => state.fabricRef)

	useEffect(() => {
		if (!fabricRef?.current) return

		const center = new Point(
			fabricRef.current.getWidth() / 2,
			fabricRef.current.getHeight() / 2,
		)
		if (zoom >= 0.2 && zoom <= 2) {
			fabricRef.current.zoomToPoint(center, zoom)
			fabricRef.current.renderAll()
		}
	}, [zoom, fabricRef])
	return (
		<div>
			<button
				onClick={() => {
					setZoom(prev => prev + 0.2)
				}}
			>
				+
			</button>
			<button
				onClick={() => {
					setZoom(prev => prev - 0.2)
				}}
			>
				-
			</button>
		</div>
	)
}

