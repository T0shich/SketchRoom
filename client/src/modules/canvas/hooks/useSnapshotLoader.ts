import { Canvas } from 'fabric'
import { useEffect } from 'react'
import type { CanvasSnapshot } from '../../../store/BoardAPI'

interface UseSnapshotLoaderProps {
	fabricCanvasRef: React.RefObject<Canvas | null>
	initialSnapshot: CanvasSnapshot | null | undefined
	snapshotLoadedRef: React.MutableRefObject<boolean>
	roomKey: string
}

export const useSnapshotLoader = ({
	fabricCanvasRef,
	initialSnapshot,
	snapshotLoadedRef,
	roomKey,
}: UseSnapshotLoaderProps) => {
	useEffect(() => {
		const canvas = fabricCanvasRef.current
		if (!canvas || !initialSnapshot || snapshotLoadedRef.current) return

		snapshotLoadedRef.current = true

		void canvas.loadFromJSON(initialSnapshot).then(() => {
			if (
				typeof initialSnapshot.scaleX === 'number' &&
				typeof initialSnapshot.scaleY === 'number' &&
				typeof initialSnapshot.left === 'number' &&
				typeof initialSnapshot.top === 'number'
			) {
				canvas.setViewportTransform([
					initialSnapshot.scaleX,
					0,
					0,
					initialSnapshot.scaleY,
					initialSnapshot.left,
					initialSnapshot.top,
				])
			}

			canvas.renderAll()
		})
	}, [initialSnapshot, roomKey, fabricCanvasRef, snapshotLoadedRef])
}
