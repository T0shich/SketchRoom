import { Canvas } from 'fabric'
import type { CanvasSnapshot } from '../store/BoardAPI'

export type SnapshotExportOptions = {
	multiplier?: number
	filename?: string
}

const makeSafeFilename = (value: string) => {
	const sanitized = value
		.replace(/[<>:"/\\|?*]+/g, '_')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 80)

	return sanitized || 'board'
}

const downloadBlob = (blob: Blob, filename: string) => {
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	// Keep it out of layout but attach for Safari compatibility.
	a.style.display = 'none'
	document.body.appendChild(a)
	a.click()
	a.remove()
	setTimeout(() => URL.revokeObjectURL(url), 0)
}

export const exportSnapshotToPng = async (
	snapshot: CanvasSnapshot,
	options: SnapshotExportOptions = {},
) => {
	const multiplier =
		typeof options.multiplier === 'number' && options.multiplier > 0
			? options.multiplier
			: 2

	const canvasElement = document.createElement('canvas')
	canvasElement.width = snapshot.width
	canvasElement.height = snapshot.height

	const fabricCanvas = new Canvas(canvasElement, {
		width: snapshot.width,
		height: snapshot.height,
		renderOnAddRemove: false,
	})

	try {
		await fabricCanvas.loadFromJSON(snapshot)

		if (
			typeof snapshot.scaleX === 'number' &&
			typeof snapshot.scaleY === 'number' &&
			typeof snapshot.left === 'number' &&
			typeof snapshot.top === 'number'
		) {
			fabricCanvas.setViewportTransform([
				snapshot.scaleX,
				0,
				0,
				snapshot.scaleY,
				snapshot.left,
				snapshot.top,
			])
		}

		fabricCanvas.renderAll()

		const dataUrl = fabricCanvas.toDataURL({
			format: 'png',
			multiplier,
		})

		const blob = await (await fetch(dataUrl)).blob()
		const filename = `${makeSafeFilename(options.filename || 'board')}.png`
		downloadBlob(blob, filename)
	} finally {
		fabricCanvas.dispose()
	}
}
