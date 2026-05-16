import express from 'express'
import { AuthController } from '../controllers/AuthController'
export function AuthRoutes(app: express.Application) {
	const authController = AuthController()
	app.post('/auth/register', authController.register)
	app.post('/auth/login', authController.login)
	app.post('/auth/refresh', authController.refreshToken)
	app.post('/auth/logout', authController.logout)
}
