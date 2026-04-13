import express from 'express'
import { BoardController } from '../controllers/BoardController'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
export function BoardRoutes(app: express.Application) {
	const boardController = BoardController()
	app.get('/boards', AuthMiddleware, boardController.getBoards)

	app.get('/boards/:id', AuthMiddleware, boardController.getBoardById)
	app.post('/boards', AuthMiddleware, boardController.createBoard)
	app.put(
		'/boards/:id/snapshot',
		AuthMiddleware,
		boardController.updateBoardSnapshot,
	)
	app.delete('/boards/:id', AuthMiddleware, boardController.deleteBoard)
}
