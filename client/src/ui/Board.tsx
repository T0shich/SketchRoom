
export interface BoardProps {
	title: string
	lastUpdated: string
	onOpen: () => void
	onDownloadPng?: () => void
	downloadDisabled?: boolean
	downloadLabel?: string
}

function Board(props: BoardProps) {
	return (
		<div className='group flex w-full items-stretch rounded-xl border border-slate-200 bg-white transition hover:border-slate-300'>
			<button
				type='button'
				onClick={props.onOpen}
				className='min-w-0 flex-1 px-6 py-4 text-left transition group-hover:bg-slate-50'
			>
				<h2 className='truncate text-lg font-semibold text-slate-900'>
					{props.title}
				</h2>
				<p className='text-sm text-slate-500'>
					Последнее обновление: {props.lastUpdated}
				</p>
			</button>
			{props.onDownloadPng && (
				<div className='flex shrink-0 items-center pr-4'>
					<button
						type='button'
						onClick={e => {
							e.stopPropagation()
							props.onDownloadPng?.()
						}}
						disabled={props.downloadDisabled}
						className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{props.downloadLabel || 'PNG'}
					</button>
				</div>
			)}
		</div>
	)
}

export default Board
