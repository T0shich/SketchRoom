import { boardData } from './Board.data'
import Board from '../../ui/Board'
const BoardList = () => {
	return (
		<div className="flex h-screen p-6">
			<div className="w-full bg-white rounded-2xl shadow-md">
				<h1 className='pt-5 pb-3 text-3xl font-bold pl-8'>Мои доски</h1>
				<div className='border-b-3 border-slate-300 mx-6'></div>
				<div className="space-y-10">
					{boardData.map(item =>
						<Board key={item.id} title={item.title} lastUpdated={item.lastUpdated} />
					)}
				</div>

			</div>
		</div>
	)
}

export default BoardList
