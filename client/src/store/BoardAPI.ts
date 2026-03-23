import axios from 'axios'
import { getAuthToken } from './Auth'

const getHeaders = () => ({
	Authorization: `Bearer ${getAuthToken()}`,
})

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

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

export const BoardAPI = {
	getBoards: async (): Promise<Board[]> => {
		const res = await axios.get(`${API_URL}/boards`, { headers: getHeaders() })
		return res.data.boards
	},

	getBoardById: async (id: string): Promise<Board> => {
		const res = await axios.get(`${API_URL}/boards/${id}`, {
			headers: getHeaders(),
		})
		return res.data.board
	},

	getBoardByRoomKey: async (roomKey: string): Promise<Board> => {
		const res = await axios.get(`${API_URL}/boards/room/${roomKey}`, {
			headers: getHeaders(),
		})
		return res.data.board
	},

	createBoard: async (title: string, roomKey: string): Promise<Board> => {
		const res = await axios.post(
			`${API_URL}/boards`,
			{ title, roomKey },
			{ headers: getHeaders() },
		)
		return res.data.board
	},

	updateBoardSnapshot: async (
		id: string,
		snapshot: CanvasSnapshot,
	): Promise<void> => {
		await axios.put(
			`${API_URL}/boards/${id}/snapshot`,
			{ snapshot },
			{ headers: getHeaders() },
		)
	},

	deleteBoard: async (id: string): Promise<void> => {
		await axios.delete(`${API_URL}/boards/${id}`, { headers: getHeaders() })
	},
}

export type { Board, CanvasSnapshot }
