import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../types/Prisma'
import { comparePassword, hashPassword } from '../utils/Hashing'
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
		try {
			const { email, password } = req.body
			if (!email || !password) {
				res.status(400).json({ message: 'Пожалуйста, заполните все поля' })
				return
			}
			const user = await prisma.user.findUnique({ where: { email } })
			if (!user) {
				res.status(404).json({ message: 'Пользователь не найден' })
				return
			}
			const isPasswordValid = comparePassword(password, user.password)
			if (!isPasswordValid) {
				res.status(401).json({ message: 'Неверный пароль' })
				return
			}
			if (!process.env.JWT_SECRET) {
				res.status(500).json({ message: 'Error with token' })
				return
			}
			const token = jwt.sign(
				{ userId: user.id, email: user.email },
				process.env.JWT_SECRET,
				{ expiresIn: '24h' },
			)

			res.status(200).json({
				message: 'User logged in successfully',
				token,
			})
		} catch (error) {
			console.error('Ошибка при входе пользователя:', error)
			res.status(500).json({ message: 'Ошибка сервера при входе пользователя' })
		}
	}
	const logout = async (req: Request, res: Response) => {
		try {
			res.status(200).json({ message: 'User logged out successfully' })
		} catch (error) {
			console.error('Ошибка при выходе пользователя:', error)
			res
				.status(500)
				.json({ message: 'Ошибка сервера при выходе пользователя' })
		}
	}

	const refreshToken = async (req: Request, res: Response) => {
		// This is a placeholder for the refresh token logic.
	}
	return {
		register,
		login,
		logout,
		refreshToken,
	}
}
