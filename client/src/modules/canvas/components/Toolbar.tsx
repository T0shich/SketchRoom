import { IoText } from "react-icons/io5"
import { LuBrush, LuEraser, LuLetterText, LuTrash2 } from "react-icons/lu"
import { PiSelectionPlusBold } from "react-icons/pi"


interface ToolbarProps {
	brushColor: string
	setBrushColor: (color: string) => void
	brushSize: number
	setBrushSize: (size: number) => void
	isEraser: boolean
	setIsEraser: (isEraser: boolean) => void
	eraserSize: number
	setEraserSize: (size: number) => void
	onClear: () => void
	canClear: boolean
	isDrawingMode: boolean
	setIsDrawingMode: (isDrawingMode: boolean) => void
	isEditingMode: boolean
	setIsEditingMode: (isEdittingMode: boolean) => void
	textMode: boolean
	setTextMode: (textMode: boolean) => void
	textSize: number
	setTextSize: (size: number) => void
}

export const Toolbar = ({
	brushColor,
	setBrushColor,
	brushSize,
	setBrushSize,
	isEraser,
	setIsEraser,
	eraserSize,
	setEraserSize,
	onClear,
	canClear,
	isDrawingMode,
	setIsDrawingMode,
	isEditingMode,
	setIsEditingMode,
	textMode,
	setTextMode,
	textSize,
	setTextSize,
}: ToolbarProps) => {
	const colors = ['#111827', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#14b8a6', '#ffffff']

	return (
		<div className='absolute left-3 top-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur'>
			{(isDrawingMode || isEditingMode) && (
				<div className='flex items-center gap-2'>
					{colors.map(color => (
						<button
							key={color}
							onClick={() => setBrushColor(color)}
							className={`h-6 w-6 rounded-full border transition ${brushColor === color ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-300 hover:border-slate-500'}`}
							style={{ backgroundColor: color }}
						/>
					))}
				</div>
			)}

			{textMode && (
				<div className='flex items-center gap-2 border-l border-slate-200 pl-3'>
					{/*small*/}
					<button
						onClick={() => setTextSize(20)}
						title="Small"
						className={`flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold transition-all ${textSize === 20
								? 'bg-slate-900 text-white shadow-sm'
								: 'bg-slate-100 text-slate-800 hover:bg-slate-200'
							}`}
					>
						{<IoText />}
					</button>
					{/*medium*/}
					<button
						onClick={() => setTextSize(40)}
						title="Medium"
						className={`flex h-9 w-9 items-center justify-center rounded-lg text-[18px] font-bold transition-all ${textSize === 40
								? 'bg-slate-900 text-white shadow-sm'
								: 'bg-slate-100 text-slate-800 hover:bg-slate-200'
							}`}
					>
						{/*large*/}
						{<IoText />}
					</button>
					<button
						onClick={() => setTextSize(80)}
						title="Large"
						className={`flex h-9 w-9 items-center justify-center rounded-lg text-[22px] font-bold transition-all ${textSize === 80
								? 'bg-slate-900 text-white shadow-sm'
								: 'bg-slate-100 text-slate-800 hover:bg-slate-200'
							}`}
					>
						{<IoText />}
					</button>
				</div>
			)}

			{!textMode && (
				<div className='flex items-center gap-2 border-l border-slate-200 pl-3'>
					<input
						type='range'
						min={isEraser ? 8 : 1}
						max={isEraser ? 120 : 50}
						value={isEraser ? eraserSize : brushSize}
						onChange={e =>
							isEraser
								? setEraserSize(Number(e.target.value))
								: setBrushSize(Number(e.target.value))
						}
						className='accent-slate-700'
					/>
					<span className='w-10 text-xs text-slate-500'>
						{isEraser ? eraserSize : brushSize}px
					</span>
				</div>
			)}

			<div className='flex items-center gap-2 border-l border-slate-200 pl-3'>
				<button
					onClick={() => {
						setIsDrawingMode(true)
						setIsEditingMode(false)
						setIsEraser(false)
						setTextMode(false)
					}}
					className={`rounded-lg px-3 py-2 text-xl font-medium transition  ${isDrawingMode && !isEraser && !textMode
						? 'bg-slate-900 text-white'
						: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
				>
					{<LuBrush />}
				</button>
				<button
					onClick={() => {
						setIsEditingMode(true)
						setIsDrawingMode(false)
						setIsEraser(false)
						setTextMode(false)
					}}
					className={`rounded-lg px-3 py-2 text-xl font-medium transition ${isEditingMode
						? 'bg-slate-900 text-white'
						: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
				>
					{<PiSelectionPlusBold />}
				</button>

				<button
					onClick={() => {
						setIsEraser(true)
						setIsDrawingMode(false)
						setIsEditingMode(false)
						setTextMode(false)
					}}
					className={`rounded-lg px-3 py-2 text-xl font-medium transition ${isEraser ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
				>
					{<LuEraser />}
				</button>
				<button
					onClick={() => {
						setTextMode(true)
						setIsDrawingMode(false)
						setIsEditingMode(false)
						setIsEraser(false)
					}}
					className={`rounded-lg px-3 py-2 text-xl font-medium transition ${textMode ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
						}`}
				>
					{<LuLetterText />}
				</button>
				<button
					onClick={onClear}
					disabled={!canClear}
					title={canClear ? 'Очистить холст' : 'Только админ комнаты может очистить холст'}
					className='rounded-lg bg-rose-500 px-3 py-2 text-xl font-medium text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-rose-500'
				>
					{<LuTrash2 />}
				</button>
			</div>
		</div>
	)
}
