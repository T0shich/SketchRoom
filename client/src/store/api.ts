import axios from 'axios'
import {
	clearAuth,
	getAuthToken,
	getRefreshToken,
	saveAuthToken,
	saveRefreshToken,
} from './Auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
	baseURL: API_URL,
})

api.interceptors.request.use(config => {
	const token = getAuthToken()
	if (token) {
		config.headers = config.headers ?? {}
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

let refreshInFlight: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
	const refreshToken = getRefreshToken()
	if (!refreshToken) return null

	const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
	const nextAccessToken = res.data?.accessToken as string | undefined
	const nextRefreshToken = res.data?.refreshToken as string | undefined
	if (!nextAccessToken || !nextRefreshToken) return null

	saveAuthToken(nextAccessToken)
	saveRefreshToken(nextRefreshToken)
	return nextAccessToken
}

api.interceptors.response.use(
	response => response,
	async error => {
		const original = error?.config
		const status = error?.response?.status
		if (!original || status !== 401 || original._retry) {
			return Promise.reject(error)
		}

		original._retry = true

		try {
			if (!refreshInFlight) {
				refreshInFlight = refreshAccessToken().finally(() => {
					refreshInFlight = null
				})
			}
			const nextAccessToken = await refreshInFlight
			if (!nextAccessToken) {
				clearAuth()
				return Promise.reject(error)
			}

			original.headers = original.headers ?? {}
			original.headers.Authorization = `Bearer ${nextAccessToken}`
			return api(original)
		} catch (e) {
			clearAuth()
			return Promise.reject(e)
		}
	},
)
