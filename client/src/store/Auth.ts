export const AUTH_TOKEN_KEY = 'sketchroom_token'

export interface AuthUser {
	userId: string
	email: string
}

interface JwtPayload {
	userId?: string
	email?: string
}

const parseJwtPayload = (token: string): JwtPayload | null => {
	try {
		const base64Payload = token.split('.')[1]
		if (!base64Payload) return null

		const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/')
		const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
		const payload = JSON.parse(atob(padded)) as JwtPayload
		return payload
	} catch {
		return null
	}
}

export const saveAuthToken = (token: string) => {
	localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export const getAuthToken = () => {
	return localStorage.getItem(AUTH_TOKEN_KEY)
}

export const clearAuthToken = () => {
	localStorage.removeItem(AUTH_TOKEN_KEY)
}

export const getAuthUser = (): AuthUser | null => {
	const token = getAuthToken()
	if (!token) return null

	const payload = parseJwtPayload(token)
	if (!payload?.userId || !payload?.email) return null

	return {
		userId: payload.userId,
		email: payload.email,
	}
}

export const isAuthenticated = () => {
	return Boolean(getAuthToken() && getAuthUser())
}
