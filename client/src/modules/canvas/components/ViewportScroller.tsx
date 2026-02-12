import { useState } from 'react'
import { useFabric } from '../../../store/useFabric'
export const ViewportScroller = () => {
	const [scrollX, setScrollX] = useState(1)
	const [scrollY, setScrollY] = useState(1)
	const fabricRef = useFabric(state => state.fabricRef)

	return (
		<div>
			<input
				type='range'
				min={-1000}
				max={1000}
				value={scrollX}
				onChange={e => {
					setScrollX(Number(e.target.value))
					if (fabricRef?.current) {
						fabricRef.current.viewportTransform[4] = Number(e.target.value)
						fabricRef.current.renderAll()
					}
				}}
			/>
			<input
				type='range'
				min={-1000}
				max={1000}
				value={scrollY}
				onChange={e => {
					setScrollY(Number(e.target.value))
					if (fabricRef?.current) {
						fabricRef.current.viewportTransform[5] = Number(e.target.value)
						fabricRef.current.renderAll()
					}
				}}
			/>
		</div>
	)
}

