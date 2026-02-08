
interface ToolbarProps {
	brushColor: string
	setBrushColor: (color: string) => void
	brushSize: number
	setBrushSize: (size: number) => void
	
	onClear: () => void
	isDrawingMode: boolean
	setIsDrawingMode: (isDrawingMode: boolean) => void
}

export const Toolbar = ({
	brushColor,
	setBrushColor,
	brushSize,
	setBrushSize,
	onClear,
	isDrawingMode,
	setIsDrawingMode,
}: ToolbarProps) => {
	const colors = [
		'#000000',
		'#ff0000',
		'#00ff00',
		'#0000ff',
		'#ffff00',
		'#ff00ff',
		'#00ffff',
		'#ffffff',
	]


	return (
		<div className='container'>
			<div className='inputs'>
				<input
					type='color'
					value={brushColor}
					onChange={e => setBrushColor(e.target.value)}
					className=''
				/>
				<div className=''>
					{colors.map(color => (
						<button
							key={color}
							onClick={() => {
								setBrushColor(color)
							}}
							className={`w-6 h-6 rounded border-2 ${brushColor === color ? 'border-blue-500' : 'border-gray-300'}`}
							style={{ backgroundColor: color }}
						></button>
					))}
				</div>
				<div className=''>
					<input
						type='range'
						min='1'
						max='50'
						value={brushSize}
						onChange={e => setBrushSize(Number(e.target.value))}
					/>
					<span className='text-sm w-8'>{brushSize}px</span>
				</div>
			

				<button
					onClick={onClear}
					className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
				>
					🗑️ Очистить
				</button>
				<button onClick={() => setIsDrawingMode(!isDrawingMode)}>
					{isDrawingMode ? '✏️ Рисование' : '👆 Выделение'}
				</button>
			</div>
		</div>
	)
}
