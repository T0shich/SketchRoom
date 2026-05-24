import { Request, Response } from 'express'
import { prisma } from '../types/Prisma'
import { hashPassword } from '../utils/Hashing'

export function UserController() {
	const updateUser = async (req: Request, res: Response) => {
		try {
			const id = req.userId
			const { email, password, name } = req.body
			if (!email || !password || !name) {
				res.status(400).json({ message: 'Пожалуйста, заполните все поля' })
				return
			}
			const hashedPassword = hashPassword(password)
			const existingUser = await prisma.user.findUnique({
				where: { id: String(id) },
			})
			if (!existingUser) {
				res.status(404).json({ message: 'Пользователь не найден' })
				return
			}

			await prisma.user.update({
				where: { id: String(id) },
				data: {
					email,
					password: hashedPassword,
					name,
				},
			})
			res.status(200).json({ message: 'Пользователь успешно обновлен' })
		} catch (error) {
			console.error('Ошибка при обновлении пользователя:', error)
			res
				.status(500)
				.json({ message: 'Ошибка сервера при обновлении пользователя' })
		}
	}

	const deleteUser = async (req: Request, res: Response) => {
		try {
			const id = req.userId
			if (!id) {
				res.status(400).json({ message: 'User not found' })
				return
			}

			await prisma.user.delete({
				where: { id: String(id) },
			})
			res.status(200).json({ message: 'User deleted successfully' })
		} catch (error) {
			console.error('Error deleting user:', error)
			res.status(500).json({ message: 'Server error while deleting user' })
		}
	}

	const getUser = async (req: Request, res: Response) => {
		try {
			const id = req.userId
			if (!id) {
				res.status(400).json({ message: 'User not found' })
				return
			}
			const user = await prisma.user.findUnique({
				where: { id: String(id) },
				select: {
					id: true,
					email: true,
					name: true,
				},
			})
			res.status(200).json({ user })
		} catch (error) {
			console.error('Error fetching user:', error)
			res.status(500).json({ message: 'Server error while fetching user' })
		}
	}

	return {
		updateUser,
		deleteUser,
		getUser,
	}
}
