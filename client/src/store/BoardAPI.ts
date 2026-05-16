import { api } from './api'

interface CanvasSnapshot {
	version: string
	objects: unknown[]
	background?: string | Record<string, unknown>
	height: number
	width: number
	left?: number
	top?: number
	scaleX?: number
	scaleY?: number
}

interface Board {
	id: string
	title: string
	roomKey: string
	snapshot?: CanvasSnapshot | null
	createdAt: string
	updatedAt: string
}

export const BoardAPI = {
	getBoards: async (): Promise<Board[]> => {
		const res = await api.get(`/boards`)
		return res.data.boards
	},

	getBoardById: async (id: string): Promise<Board> => {
		const res = await api.get(`/boards/${id}`)
		return res.data.board
	},

	getBoardByRoomKey: async (roomKey: string): Promise<Board> => {
		const res = await api.get(`/boards/room/${roomKey}`)
		return res.data.board
	},

	createBoard: async (title: string, roomKey: string): Promise<Board> => {
		const res = await api.post(`/boards`, { title, roomKey })
		return res.data.board
	},

	updateBoardSnapshot: async (
		id: string,
		snapshot: CanvasSnapshot,
	): Promise<void> => {
		await api.put(`/boards/${id}/snapshot`, { snapshot })
	},

	deleteBoard: async (id: string): Promise<void> => {
		await api.delete(`/boards/${id}`)
	},
}

export type { Board, CanvasSnapshot }
