
export interface BoardProps {
	title: string
	lastUpdated: string
}

function Board(props: BoardProps) {
	return (
		<div className='bg-white w-full pl-8'>
			<h2 className='text-xl font-bold'>{props.title}</h2>
			<p className='text-sm text-gray-500 '>Последнее обновление: {props.lastUpdated}</p>
		</div>
	)
}

export default Board
