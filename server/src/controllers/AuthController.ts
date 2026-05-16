import { Request, Response } from 'express'
import { prisma } from '../types/Prisma'
import { comparePassword, hashPassword } from '../utils/Hashing'
import {
	generateRefreshToken,
	generateSessionId,
	hashToken,
	parseRefreshToken,
	refreshTokenExpiresAt,
	signAccessToken,
	verifyAccessToken,
} from '../utils/Tokens'

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
				const response: AuthResponse = {
					message: 'Пожалуйста, заполните все поля',
				}
				res.status(400).json(response)
				return
			}

			// Валидация email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				const response: AuthResponse = {
					message: 'Введите корректный email',
					field: 'email',
				}
				res.status(400).json(response)
				return
			}

			// Валидация пароля
			if (password.length < 6) {
				const response: AuthResponse = {
					message: 'Пароль должен содержать минимум 6 символов',
					field: 'password',
				}
				res.status(400).json(response)
				return
			}

			// Валидация имени
			if (name.trim().length < 2) {
				const response: AuthResponse = {
					message: 'Имя должно содержать минимум 2 символа',
					field: 'name',
				}
				res.status(400).json(response)
				return
			}

			if (name.trim().length > 50) {
				const response: AuthResponse = {
					message: 'Имя не должно превышать 50 символов',
					field: 'name',
				}
				res.status(400).json(response)
				return
			}

			// Проверяем, существует ли пользователь с такой почтой
			const existingUser = await prisma.user.findUnique({ where: { email } })
			if (existingUser) {
				const response: AuthResponse = {
					message: 'Пользователь с таким email уже существует',
					field: 'email',
				}
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

			const sessionId = generateSessionId()
			const refreshTokenPlain = generateRefreshToken(sessionId)
			const refreshTokenHashed = hashToken(refreshTokenPlain)
			const expiresAt = refreshTokenExpiresAt()

			await prisma.$transaction([
				prisma.session.create({
					data: { userId: user.id, token: sessionId },
				}),
				prisma.refreshToken.create({
					data: {
						userId: user.id,
						token: refreshTokenHashed,
						expiresAt,
					},
				}),
			])

			const accessToken = signAccessToken({
				userId: user.id,
				email: user.email,
				name: user.name,
				sid: sessionId,
			})

			res.status(201).json({
				message: 'User registered successfully',
				accessToken,
				refreshToken: refreshTokenPlain,
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
				const response: AuthResponse = {
					message: 'Введите корректный email',
					field: 'email',
				}
				res.status(400).json(response)
				return
			}

			const user = await prisma.user.findUnique({ where: { email } })
			if (!user) {
				const response: AuthResponse = {
					message: 'Пользователь не найден',
					field: 'email',
				}
				res.status(404).json(response)
				return
			}

			const isPasswordValid = comparePassword(password, user.password)
			if (!isPasswordValid) {
				const response: AuthResponse = {
					message: 'Неверный пароль',
					field: 'password',
				}
				res.status(401).json(response)
				return
			}

			const sessionId = generateSessionId()
			const refreshTokenPlain = generateRefreshToken(sessionId)
			const refreshTokenHashed = hashToken(refreshTokenPlain)
			const expiresAt = refreshTokenExpiresAt()

			await prisma.$transaction([
				prisma.session.create({
					data: { userId: user.id, token: sessionId },
				}),
				prisma.refreshToken.create({
					data: {
						userId: user.id,
						token: refreshTokenHashed,
						expiresAt,
					},
				}),
			])

			const accessToken = signAccessToken({
				userId: user.id,
				email: user.email,
				name: user.name,
				sid: sessionId,
			})

			res.status(200).json({
				message: 'User logged in successfully',
				accessToken,
				refreshToken: refreshTokenPlain,
			})
		} catch (error) {
			console.error('Ошибка при входе пользователя:', error)
			res.status(500).json({ message: 'Ошибка сервера при входе пользователя' })
		}
	}
	const logout = async (req: Request, res: Response) => {
		try {
			const refreshTokenPlain = String(req.body?.refreshToken || '')
			const bearer = req.headers.authorization?.split(' ')[1]

			// Prefer refresh-token logout (device/session specific)
			if (refreshTokenPlain) {
				const parsed = parseRefreshToken(refreshTokenPlain)
				const sessionId = parsed?.sessionId
				const hashed = hashToken(refreshTokenPlain)
				await prisma.$transaction([
					prisma.refreshToken.deleteMany({ where: { token: hashed } }),
					sessionId
						? prisma.session.deleteMany({ where: { token: sessionId } })
						: prisma.session.deleteMany({ where: { token: '__nope__' } }),
				])
				res.status(200).json({ message: 'User logged out successfully' })
				return
			}

			// Fallback: logout by access token session id
			if (bearer) {
				try {
					const decoded = verifyAccessToken(bearer)
					await prisma.session.deleteMany({ where: { token: decoded.sid } })
				} catch {
					// ignore token errors
				}
			}

			res.status(200).json({ message: 'User logged out successfully' })
		} catch (error) {
			console.error('Ошибка при выходе пользователя:', error)
			res
				.status(500)
				.json({ message: 'Ошибка сервера при выходе пользователя' })
		}
	}

	const refreshToken = async (req: Request, res: Response) => {
		try {
			const refreshTokenPlain = String(req.body?.refreshToken || '')
			if (!refreshTokenPlain) {
				res.status(400).json({ message: 'Refresh token is required' })
				return
			}

			const parsed = parseRefreshToken(refreshTokenPlain)
			if (!parsed?.sessionId) {
				res.status(401).json({ message: 'Invalid refresh token' })
				return
			}

			const hashed = hashToken(refreshTokenPlain)
			const stored = await prisma.refreshToken.findUnique({
				where: { token: hashed },
				include: { user: true },
			})
			if (!stored) {
				res.status(401).json({ message: 'Invalid refresh token' })
				return
			}
			if (stored.expiresAt.getTime() <= Date.now()) {
				await prisma.refreshToken.deleteMany({ where: { token: hashed } })
				res.status(401).json({ message: 'Refresh token expired' })
				return
			}

			const session = await prisma.session.findUnique({
				where: { token: parsed.sessionId },
			})
			if (!session || session.userId !== stored.userId) {
				res.status(401).json({ message: 'Invalid session' })
				return
			}

			// Rotate session + refresh token
			const nextSessionId = generateSessionId()
			const nextRefreshPlain = generateRefreshToken(nextSessionId)
			const nextRefreshHashed = hashToken(nextRefreshPlain)
			const nextExpiresAt = refreshTokenExpiresAt()

			await prisma.$transaction([
				prisma.refreshToken.deleteMany({ where: { token: hashed } }),
				prisma.session.deleteMany({ where: { token: parsed.sessionId } }),
				prisma.session.create({
					data: { userId: stored.userId, token: nextSessionId },
				}),
				prisma.refreshToken.create({
					data: {
						userId: stored.userId,
						token: nextRefreshHashed,
						expiresAt: nextExpiresAt,
					},
				}),
			])

			const accessToken = signAccessToken({
				userId: stored.userId,
				email: stored.user.email,
				name: stored.user.name,
				sid: nextSessionId,
			})

			res.status(200).json({ accessToken, refreshToken: nextRefreshPlain })
		} catch (error) {
			console.error('Ошибка при обновлении токена:', error)
			res.status(500).json({ message: 'Ошибка сервера при обновлении токена' })
		}
	}
	return {
		register,
		login,
		logout,
		refreshToken,
	}
}
