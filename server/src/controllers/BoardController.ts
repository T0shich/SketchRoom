import { Request, Response } from 'express'
import { ensureRoomRecord } from '../store/rooms'
import { prisma } from '../types/Prisma'
import { normalizeRoomKey } from '../utils/NormalizeRoomKey'

export function BoardController() {
	const getBoards = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			const boards = await prisma.board.findMany({
				where: { ownerId: userId },
				select: {
					id: true,
					title: true,
					roomKey: true,
					createdAt: true,
					updatedAt: true,
				},
			})
			res.status(200).json({ boards })
		} catch (error) {
			console.error('Error fetching boards:', error)
			res.status(500).json({ message: 'Server error while fetching boards' })
		}
	}

	const getBoardById = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			const { id } = req.params

			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			const board = await prisma.board.findFirst({
				where: {
					id: String(id),
					ownerId: userId,
				},
			})

			if (!board) {
				return res.status(404).json({ message: 'Board not found' })
			}

			ensureRoomRecord(board.roomKey)

			res.status(200).json({ board })
		} catch (error) {
			console.error('Error fetching board:', error)
			res.status(500).json({ message: 'Server error while fetching board' })
		}
	}

	const getBoardByRoomKey = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			const { roomKey } = req.params
			const normalizedRoomKey = normalizeRoomKey(
				typeof roomKey === 'string' ? roomKey : undefined,
			)

			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			if (!normalizedRoomKey) {
				return res.status(400).json({ message: 'Invalid room key' })
			}

			const board = await prisma.board.findFirst({
				where: {
					roomKey: normalizedRoomKey,
				},
			})

			if (!board) {
				return res.status(404).json({ message: 'Board not found' })
			}

			ensureRoomRecord(board.roomKey)

			res.status(200).json({ board })
		} catch (error) {
			console.error('Error fetching board:', error)
			res.status(500).json({ message: 'Server error' })
		}
	}

	const createBoard = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			const { title, roomKey } = req.body
			const normalizedRoomKey = normalizeRoomKey(roomKey)

			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			if (!normalizedRoomKey) {
				return res.status(400).json({ message: 'roomKey is required' })
			}

			ensureRoomRecord(normalizedRoomKey)

			const board = await prisma.board.create({
				data: {
					title: title || 'Новая доска',
					roomKey: normalizedRoomKey,
					ownerId: userId,
				},
			})

			res.status(201).json({ board })
		} catch (error: any) {
			if (error.code === 'P2002') {
				return res.status(400).json({ message: 'Room key already exists' })
			}
			console.error('Error creating board:', error)
			res.status(500).json({ message: 'Server error while creating board' })
		}
	}

	const updateBoardSnapshot = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			const { id } = req.params
			const { snapshot } = req.body

			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			const board = await prisma.board.findFirst({
				where: { id: String(id), ownerId: userId },
			})

			if (!board) {
				return res.status(404).json({ message: 'Board not found' })
			}

			const updated = await prisma.board.update({
				where: { id: String(id) },
				data: { snapshot },
			})

			res.status(200).json({ board: updated })
		} catch (error) {
			console.error('Error updating board snapshot:', error)
			res.status(500).json({ message: 'Server error' })
		}
	}

	const deleteBoard = async (req: Request, res: Response) => {
		try {
			const userId = req.userId
			const { id } = req.params

			if (!userId) {
				return res.status(401).json({ message: 'Unauthorized' })
			}

			const board = await prisma.board.findFirst({
				where: { id: String(id), ownerId: userId },
			})

			if (!board) {
				return res.status(404).json({ message: 'Board not found' })
			}

			await prisma.board.delete({ where: { id: String(id) } })

			res.status(200).json({ message: 'Board deleted' })
		} catch (error) {
			console.error('Error deleting board:', error)
			res.status(500).json({ message: 'Server error' })
		}
	}

	return {
		getBoards,
		getBoardById,
		getBoardByRoomKey,
		createBoard,
		updateBoardSnapshot,
		deleteBoard,
	}
}
