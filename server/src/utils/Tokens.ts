import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m'
const REFRESH_TOKEN_TTL_DAYS = Number(
	process.env.REFRESH_TOKEN_TTL_DAYS || '30',
)

type AccessTokenPayload = {
	userId: string
	email: string
	name?: string
	sid: string
	type: 'access'
}

const getJwtSecret = () => {
	const secret = process.env.JWT_SECRET
	if (!secret) {
		throw new Error('JWT_SECRET is not set')
	}
	return secret
}

export const generateSessionId = () => crypto.randomBytes(24).toString('hex')

export const generateRefreshToken = (sessionId: string) => {
	const secret = crypto.randomBytes(48).toString('hex')
	return `${sessionId}.${secret}`
}

export const parseRefreshToken = (refreshToken: string) => {
	const idx = refreshToken.indexOf('.')
	if (idx <= 0) return null
	const sessionId = refreshToken.slice(0, idx)
	if (!sessionId) return null
	return { sessionId }
}

export const hashToken = (token: string) => {
	const pepper = process.env.SECRET_PEPPER || 'default_pepper'
	return crypto.createHmac('sha256', pepper).update(token).digest('hex')
}

export const refreshTokenExpiresAt = () => {
	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS)
	return expiresAt
}

export const signAccessToken = (payload: Omit<AccessTokenPayload, 'type'>) => {
	return jwt.sign(
		{
			...payload,
			type: 'access',
		},
		getJwtSecret(),
		{ expiresIn: ACCESS_TOKEN_TTL },
	)
}

export const verifyAccessToken = (token: string) => {
	const decoded = jwt.verify(
		token,
		getJwtSecret(),
	) as Partial<AccessTokenPayload>
	if (decoded?.type !== 'access') {
		throw new Error('Invalid token type')
	}
	if (!decoded.userId || !decoded.sid || !decoded.email) {
		throw new Error('Invalid token payload')
	}
	return decoded as AccessTokenPayload
}
