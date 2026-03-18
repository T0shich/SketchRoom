import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../types/Prisma'
import { hashPassword } from '../utils/Hashing'
export function AuthController() {
	const register = async (req: Request, res: Response) => {
		try {
			const { email, password, name } = req.body
			if (!email || !password || !name) {
				res.status(400).json({ message: 'Пожалуйста, заполните все поля' })
				return
			}
			const hashedPassword = hashPassword(password)
			const user = await prisma.user.create({
				data: {
					email,
					password: hashedPassword,
					name,
				},
			})

			if (!process.env.JWT_SECRET) {
				res.status(500).json({ message: 'Error with token' })
				return
			}

			const token = jwt.sign(
				{ userId: user.id, email: user.email },
				process.env.JWT_SECRET,
				{ expiresIn: '24h' },
			)
			res.status(201).json({
				message: 'User registered successfully',
				token,
			})
		} catch (error) {
			console.error('Ошибка при создании пользователя:', error)
			res
				.status(500)
				.json({ message: 'Ошибка сервера при создании пользователя' })
		}
	}
	const login = async (req: Request, res: Response) => {
		// Реализация входа пользователя
	}
	const logout = async (req: Request, res: Response) => {
		// Реализация выхода пользователя
	}

	const refreshToken = async (req: Request, res: Response) => {
		// Реализация обновления токена
	}
	return {
		register,
		login,
		logout,
		refreshToken,
	}
}
