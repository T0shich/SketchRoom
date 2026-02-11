import React, { useEffect, useState } from 'react'
import { Canvas, Point } from 'fabric'
interface ZoomProps {
	fabricRef: React.MutableRefObject<Canvas | null>
}

const Zoom = ({ fabricRef }: ZoomProps) => {
	const [zoom, setZoom] = useState(1)

	useEffect(() => {
		if (!fabricRef.current) return

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

export default Zoom
