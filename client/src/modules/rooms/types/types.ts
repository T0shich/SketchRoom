export interface JoinedRoomResponse {
	success: boolean
	roomKey: string
	message?: string
	users?: RoomUser[]
	joinRequests?: JoinRequest[]
}

export interface RoomUser {
	id: string
	name?: string
	admin?: boolean
}

export interface RoomUsersUpdatedPayload {
	roomKey: string
	users: RoomUser[]
}

export interface JoinRequest {
	id: string
	name?: string
}

export interface RoomJoinRequestsUpdatedPayload {
	roomKey: string
	requests: JoinRequest[]
}

export interface KickedFromRoomPayload {
	roomKey: string
	message?: string
}
