import { NextFunction, Request, Response } from 'express'
import { prisma } from '../types/Prisma'
import { verifyAccessToken } from '../utils/Tokens'

declare module 'express' {
	interface Request {
		userId?: string
	}
}

export function AuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
) {
	const token = req.headers.authorization?.split(' ')[1]
	if (!token) {
		return res.status(401).json({ message: 'No token provided' })
	}
	void (async () => {
		try {
			const decoded = verifyAccessToken(token)
			const session = await prisma.session.findUnique({
				where: { token: decoded.sid },
			})
			if (!session || session.userId !== decoded.userId) {
				res.status(401).json({ message: 'Invalid token' })
				return
			}
			req.userId = decoded.userId
			next()
		} catch {
			res.status(401).json({ message: 'Invalid token' })
		}
	})()
}
