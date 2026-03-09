import { useState } from 'react'
import { useFabric } from '../../../store/useFabric'

export const ViewportScroller = () => {
	const [scrollX, setScrollX] = useState(0)
	const [scrollY, setScrollY] = useState(0)
	const fabricRef = useFabric(state => state.fabricRef)

	return (
		<div className='absolute bottom-3 left-3 z-10 w-56 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur'>
			<div className='mb-2 text-xs font-medium text-slate-500'>Позиция холста</div>
			<div className='space-y-2'>
				<input
					type='range'
					min={-1000}
					max={1000}
					value={scrollX}
					onChange={e => {
						const value = Number(e.target.value)
						setScrollX(value)
						if (fabricRef?.current) {
							fabricRef.current.viewportTransform[4] = value
							fabricRef.current.renderAll()
						}
					}}
					className='w-full accent-slate-700'
				/>
				<input
					type='range'
					min={-1000}
					max={1000}
					value={scrollY}
					onChange={e => {
						const value = Number(e.target.value)
						setScrollY(value)
						if (fabricRef?.current) {
							fabricRef.current.viewportTransform[5] = value
							fabricRef.current.renderAll()
						}
					}}
					className='w-full accent-slate-700'
				/>
			</div>
		</div>
	)
}
