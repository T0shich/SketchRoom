import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../types/Prisma'
import { comparePassword, hashPassword } from '../utils/Hashing'

interface AuthResponse {
	message: string
	field?: string
}

export function AuthController() {
	const register = async (req: Request, res: Response) => {
		try {
			const { email, password, name } = req.body

			// Валидация обязательных полей
			if (!email || !password || !name) {
				const response: AuthResponse = { message: 'Пожалуйста, заполните все поля' }
				res.status(400).json(response)
				return
			}

			// Валидация email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				const response: AuthResponse = { message: 'Введите корректный email', field: 'email' }
				res.status(400).json(response)
				return
			}

			// Валидация пароля
			if (password.length < 6) {
				const response: AuthResponse = { message: 'Пароль должен содержать минимум 6 символов', field: 'password' }
				res.status(400).json(response)
				return
			}

			// Валидация имени
			if (name.trim().length < 2) {
				const response: AuthResponse = { message: 'Имя должно содержать минимум 2 символа', field: 'name' }
				res.status(400).json(response)
				return
			}

			if (name.trim().length > 50) {
				const response: AuthResponse = { message: 'Имя не должно превышать 50 символов', field: 'name' }
				res.status(400).json(response)
				return
			}

			// Проверяем, существует ли пользователь с такой почтой
			const existingUser = await prisma.user.findUnique({ where: { email } })
			if (existingUser) {
				const response: AuthResponse = { message: 'Пользователь с таким email уже существует', field: 'email' }
				res.status(400).json(response)
				return
			}

			const hashedPassword = hashPassword(password)
			const user = await prisma.user.create({
				data: {
					email,
					password: hashedPassword,
					name: name.trim(),
				},
			})

			if (!process.env.JWT_SECRET) {
				res.status(500).json({ message: 'Внутренняя ошибка сервера' })
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

			// Валидация обязательных полей
			if (!email || !password) {
				res.status(400).json({ message: 'Пожалуйста, заполните все поля' })
				return
			}

			// Валидация email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				const response: AuthResponse = { message: 'Введите корректный email', field: 'email' }
				res.status(400).json(response)
				return
			}

			const user = await prisma.user.findUnique({ where: { email } })
			if (!user) {
				const response: AuthResponse = { message: 'Пользователь не найден', field: 'email' }
				res.status(404).json(response)
				return
			}

			const isPasswordValid = comparePassword(password, user.password)
			if (!isPasswordValid) {
				const response: AuthResponse = { message: 'Неверный пароль', field: 'password' }
				res.status(401).json(response)
				return
			}

			if (!process.env.JWT_SECRET) {
				res.status(500).json({ message: 'Внутренняя ошибка сервера' })
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
