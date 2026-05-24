import { Canvas } from 'fabric'
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import type { Board, CanvasSnapshot } from '../../../store/BoardAPI'
import { BoardAPI } from '../../../store/BoardAPI'

export const useBoardState = (
	boardId: string | null,
	authenticated: boolean,
	token: string | null,
	fabricRef: RefObject<Canvas | null> | null,
) => {
	const [board, setBoard] = useState<Board | null>(null)
	const [isBoardLoading, setIsBoardLoading] = useState(false)
	const [boardError, setBoardError] = useState('')
	const [isSaving, setIsSaving] = useState(false)
	const [saveStatus, setSaveStatus] = useState('')

	useEffect(() => {
		if (isSaving) setSaveStatus('Сохранение...')
		const timer = setTimeout(() => {
			setSaveStatus('')
		}, 3000)
		return () => clearTimeout(timer)
	}, [isSaving])

	useEffect(() => {
		if (!authenticated || !token || !boardId) {
			setBoard(null)
			setBoardError('')
			return
		}

		setIsBoardLoading(true)
		setBoardError('')

		void BoardAPI.getBoardById(boardId)
			.then(boardData => {
				const normalizedRoomKey = boardData.roomKey?.toUpperCase()
				setBoard({ ...boardData, roomKey: normalizedRoomKey })
			})
			.catch(() => {
				setBoard(null)
				setBoardError('Не удалось открыть доску')
			})
			.finally(() => setIsBoardLoading(false))
	}, [authenticated, token, boardId])

	const saveBoardSnapshot = async () => {
		if (!board?.id) return
		const canvas = fabricRef?.current
		if (!canvas) {
			setSaveStatus('Холст ещё не готов')
			return
		}

		setIsSaving(true)
		setSaveStatus('')

		try {
			const viewportTransform = canvas.viewportTransform
			const rawSnapshot = canvas.toJSON() as Record<string, unknown>
			const backgroundColor = canvas.backgroundColor as unknown
			const snapshot: CanvasSnapshot = {
				version: String(rawSnapshot.version || '6.0.0'),
				objects: Array.isArray(rawSnapshot.objects) ? rawSnapshot.objects : [],
				background:
					typeof backgroundColor === 'string' ||
					(typeof backgroundColor === 'object' && backgroundColor !== null)
						? (backgroundColor as string | Record<string, unknown>)
						: undefined,
				height: canvas.getHeight(),
				width: canvas.getWidth(),
				left: viewportTransform?.[4],
				top: viewportTransform?.[5],
				scaleX: viewportTransform?.[0],
				scaleY: viewportTransform?.[3],
			}
			await BoardAPI.updateBoardSnapshot(board.id, snapshot)
			setSaveStatus('Сохранено')
		} catch {
			setSaveStatus('Ошибка сохранения')
		} finally {
			setIsSaving(false)
		}
	}
	return {
		board,
		isBoardLoading,
		boardError,
		isSaving,
		saveStatus,
		saveBoardSnapshot,
	}
}
