import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import type { CanvasSnapshot } from '../../../store/BoardAPI'
import { useCanvasInit } from '../hooks/useCanvasInit'
import { useDrawingModes } from '../hooks/useDrawingModes'
import { useEraser } from '../hooks/useEraser'
import { usePasteImage } from '../hooks/usePasteImage'
import { useSnapshotLoader } from '../hooks/useSnapshotLoader'
import { useSocketSync } from '../hooks/useSocketSync'
import { useTextMode } from '../hooks/useTextMode'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { serializeObject } from '../Socket/FabrickObjects'
import { useSocketEvents } from '../Socket/useSocketEvents'
import { Toolbar } from './Toolbar'
import { ViewportScroller } from './ViewportScroller'
import { Zoom } from './Zoom'

interface DrawingCanvasProps {
	socket: Socket | null
	roomKey: string
	initialSnapshot?: CanvasSnapshot | null
	canClear?: boolean
}

const INITIAL_BRUSH_COLOR = '#111827'
const INITIAL_BRUSH_SIZE = 3
const INITIAL_ERASER_SIZE = 20

export const DrawingCanvas = ({
	socket,
	roomKey,
	initialSnapshot = null,
	canClear = false,
}: DrawingCanvasProps) => {
	const [brushColor, setBrushColor] = useState(INITIAL_BRUSH_COLOR)
	const [brushSize, setBrushSize] = useState(INITIAL_BRUSH_SIZE)
	const [isEraser, setIsEraser] = useState(false)
	const [textMode, setTextMode] = useState(false)
	const [textSize, setTextSize] = useState(40)
	const [eraserSize, setEraserSize] = useState(INITIAL_ERASER_SIZE)
	const [isDrawingMode, setIsDrawingMode] = useState(true)
	const [isEditingMode, setIsEditingMode] = useState(false)
	const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)

	const { fabricCanvasRef, canvasHostRef, snapshotLoadedRef } = useCanvasInit({
		roomKey,
		initialBrushColor: INITIAL_BRUSH_COLOR,
		initialBrushSize: INITIAL_BRUSH_SIZE,
	})

	const { eraserPos } = useEraser({
		fabricCanvasRef,
		socket,
		roomKey,
		isEraser,
	})


	usePasteImage({ socket, roomKey })

	useSnapshotLoader({
		fabricCanvasRef,
		initialSnapshot,
		snapshotLoadedRef,
		roomKey,
	})

	useTextMode({
		textMode,
		setTextMode,
		canvasRef: fabricCanvasRef,
		brushColor,
		textSize,
		onTextCommitted: textObject => {
			if (socket) {
				socket.emit('object:added', {
					roomKey,
					object: serializeObject(textObject),
				})
			}
		},
	})

	useDrawingModes({
		brushColor,
		brushSize,
		eraserSize,
		isEraser,
		isDrawingMode,
		textMode,
		fabricCanvasRef,
	})

	useSocketEvents({ fabricCanvasRef, socket, roomKey })

	useSocketSync({
		fabricCanvasRef,
		socket,
		roomKey,
		isEraser,
	})

	useEffect(() => {
		setIsClearConfirmOpen(false)
	}, [roomKey])

	const performClear = () => {
		fabricCanvasRef.current?.getObjects().forEach(obj => {
			fabricCanvasRef.current?.remove(obj)
		})
		fabricCanvasRef.current?.renderAll()
		if (socket) {
			socket.emit('canvas:clear', { roomKey })
		}
	}

	const requestClear = () => {
		if (!canClear) return
		setIsClearConfirmOpen(true)
	}

	const confirmClear = () => {
		setIsClearConfirmOpen(false)
		performClear()
	}

	useUndoRedo(socket, roomKey)


	return (
		<div className='relative h-full w-full bg-slate-50'>
			<Toolbar
				brushColor={brushColor}
				setBrushColor={setBrushColor}
				brushSize={brushSize}
				setBrushSize={setBrushSize}
				isEraser={isEraser}
				setIsEraser={setIsEraser}
				textMode={textMode}
				setTextMode={setTextMode}
				eraserSize={eraserSize}
				setEraserSize={setEraserSize}
				onClear={requestClear}
				canClear={canClear}
				isDrawingMode={isDrawingMode}
				setIsDrawingMode={setIsDrawingMode}
				isEditingMode={isEditingMode}
				setIsEditingMode={setIsEditingMode}
				textSize={textSize}
				setTextSize={setTextSize}
			/>
			{isClearConfirmOpen && (
				<div className='absolute left-3 top-20 z-20 w-[260px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur'>
					<div className='text-sm font-medium text-slate-900'>Очистить холст?</div>
					<div className='mt-1 text-xs text-slate-500'>Действие удалит все объекты у всех участников.</div>
					<div className='mt-3 flex items-center justify-end gap-2'>
						<button
							type='button'
							onClick={() => setIsClearConfirmOpen(false)}
							className='rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200'
						>
							Отмена
						</button>
						<button
							type='button'
							onClick={confirmClear}
							className='rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-600'
						>
							Очистить
						</button>
					</div>
				</div>
			)}
			<Zoom />
			<ViewportScroller />
			{isEraser && eraserPos && (
				<div
					className='pointer-events-none absolute z-30 rounded-full border-2 border-slate-900 bg-white/30'
					style={{
						width: eraserSize,
						height: eraserSize,
						left: eraserPos.x - eraserSize / 2,
						top: eraserPos.y - eraserSize / 2,
					}}
				/>
			)}
			<div ref={canvasHostRef} className='h-full w-full' />
		</div>
	)
}



