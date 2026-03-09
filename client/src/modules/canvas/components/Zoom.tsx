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
		<div className='absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur'>
			<button
				onClick={() => setZoom(prev => Math.max(0.2, Number((prev - 0.2).toFixed(1))))}
				className='h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-900'
			>
				-
			</button>
			<div className='min-w-14 text-center text-xs font-medium text-slate-600'>
				{Math.round(zoom * 100)}%
			</div>
			<button
				onClick={() => setZoom(prev => Math.min(2, Number((prev + 0.2).toFixed(1))))}
				className='h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-900'
			>
				+
			</button>
		</div>
	)
}
