import express from 'express'
import { AuthController } from '../controllers/AuthController'
import { AuthMiddleware } from '../middleware/AuthMiddleware'
export function AuthRoutes(app: express.Application) {
	const authController = AuthController()
	app.post('/auth/register', authController.register)
	app.post('/auth/login', authController.login)
	app.post('/auth/logout', authController.logout)
}
