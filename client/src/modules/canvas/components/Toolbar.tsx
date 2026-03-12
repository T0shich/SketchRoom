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
isDrawingMode: boolean
setIsDrawingMode: (isDrawingMode: boolean) => void
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
isDrawingMode,
setIsDrawingMode,
}: ToolbarProps) => {
const colors = ['#111827', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#14b8a6', '#ffffff']

return (
<div className='absolute left-3 top-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur'>
{!isEraser && (
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

<div className='flex items-center gap-2 border-l border-slate-200 pl-3'>
<input
type='range'
min={isEraser ? 8 : 1}
max={isEraser ? 120 : 50}
value={isEraser ? eraserSize : brushSize}
onChange={e =>
isEraser ? setEraserSize(Number(e.target.value)) : setBrushSize(Number(e.target.value))
}
className='accent-slate-700'
/>
<span className='w-10 text-xs text-slate-500'>
{isEraser ? eraserSize : brushSize}px
</span>
</div>

<div className='flex items-center gap-2 border-l border-slate-200 pl-3'>
<button
onClick={() => setIsDrawingMode(!isDrawingMode)}
disabled={isEraser}
className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
isEraser
? 'cursor-not-allowed opacity-40 bg-slate-100 text-slate-700'
: isDrawingMode
? 'bg-slate-900 text-white'
: 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}`}
>
{isDrawingMode ? 'Рисование' : 'Выделение'}
</button>
<button
onClick={() => setIsEraser(!isEraser)}
className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
isEraser ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
}`}
>
Ластик
</button>
<button
onClick={onClear}
className='rounded-lg bg-rose-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-rose-600'
>
Очистить
</button>
</div>
</div>
)
}
