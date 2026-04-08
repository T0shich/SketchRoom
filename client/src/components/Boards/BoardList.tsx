import axios from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BoardAPI, type Board as BoardItem } from '../../store/BoardAPI'
import Board from '../../ui/Board'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const formatDate = (value: string) => {
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return value

	return date.toLocaleString('ru-RU', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const BoardList = () => {
	const navigate = useNavigate()
	const [boards, setBoards] = useState<BoardItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [isCreating, setIsCreating] = useState(false)
	const [error, setError] = useState('')

	const fetchBoards = async () => {
		setIsLoading(true)
		setError('')
		try {
			const items = await BoardAPI.getBoards()
			setBoards(items)
		} catch {
			setError('Не удалось загрузить список досок')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		void fetchBoards()
	}, [])

	const handleCreateBoard = async () => {
		const titleInput = window.prompt('Название доски', 'Новая доска')
		if (titleInput === null) return

		const title = titleInput.trim() || 'Новая доска'
		setIsCreating(true)
		setError('')

		try {
			const roomResponse = await axios.post(`${API_URL}/rooms`)
			const roomKey = roomResponse.data?.key

			if (typeof roomKey !== 'string' || !roomKey) {
				throw new Error('Некорректный room key')
			}

			const board = await BoardAPI.createBoard(title, roomKey)
			navigate(`/editor?boardId=${board.id}`)
		} catch {
			setError('Не удалось создать доску')
		} finally {
			setIsCreating(false)
		}
	}

	return (
		<div className="flex  p-6">
			<div className="w-full bg-white  rounded-2xl shadow-md">
				<div className='flex items-center justify-between px-8 pt-5 pb-3'>
					<h1 className='text-3xl font-bold'>Мои доски</h1>
					<button
						type='button'
						onClick={handleCreateBoard}
						disabled={isCreating}
						className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
					>
						{isCreating ? 'Создание...' : 'Новая доска'}
					</button>
				</div>
				<div className='border-b-3 border-slate-300 mx-6'></div>
				<div className='px-8 py-6'>
					{isLoading ? (
						<div className='text-sm text-slate-500'>Загрузка...</div>
					) : boards.length === 0 ? (
						<div className='text-sm text-slate-500'>У вас пока нет досок</div>
					) : (
						<div className='space-y-4'>
							{boards.map(item => (
								<Board
									key={item.id}
									title={item.title}
									lastUpdated={formatDate(item.updatedAt)}
									onOpen={() => navigate(`/editor?boardId=${item.id}`)}
								/>
							))}
						</div>
					)}
					{error && <div className='mt-4 text-sm text-rose-500'>{error}</div>}
				</div>
			</div>
		</div>
	)
}

export default BoardList
