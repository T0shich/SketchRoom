
export interface BoardProps {
	title: string
	lastUpdated: string
	onOpen: () => void
}

function Board(props: BoardProps) {
	return (
		<button
			type='button'
			onClick={props.onOpen}
			className='w-full rounded-xl border border-slate-200 bg-white px-6 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50'
		>
			<h2 className='text-lg font-semibold text-slate-900'>{props.title}</h2>
			<p className='text-sm text-slate-500'>Последнее обновление: {props.lastUpdated}</p>
		</button>
	)
}

export default Board
