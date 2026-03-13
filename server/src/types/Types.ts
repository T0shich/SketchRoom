export interface User {
	id: string
	name?: string
	admin?: boolean
}

export interface Room {
	key: string
	createdAt: Date
	users: User[]
}

export interface CanvasObjectPayload {
	roomKey?: string
	object?: unknown
}

export interface CanvasClearPayload {
	roomKey?: string
}
