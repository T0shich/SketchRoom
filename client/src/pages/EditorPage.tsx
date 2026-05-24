import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import SideBar from '../components/SideBar'
import { DrawingCanvas } from '../modules/canvas'
import EditorHeader from '../modules/rooms/components/EditorHeader'
import EditorLobby from '../modules/rooms/components/EditorLobby'
import JoinRequestsPanel from '../modules/rooms/components/JoinRequestsPanel'
import { useBoardState } from '../modules/rooms/types/useBoardState'
import { useRoomSocket } from '../modules/rooms/types/useRoomSocket'
import { getAuthToken, getAuthUser } from '../store/Auth'
import { useFabric } from '../store/useFabric'
import { Layout } from '../ui/Layout'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const socket: Socket = io(API_URL)

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		socket.disconnect()
	})
}

const EditorPage = () => {
	const [searchParams, setSearchParams] = useSearchParams()
	const token = getAuthToken()
	const user = getAuthUser()
	const authenticated = Boolean(token && user)
	const modeQuery = searchParams.get('mode')
	const boardId = searchParams.get('boardId')
	const initialMode = modeQuery === 'join' ? 'join' : 'create'
	const fabricRef = useFabric(state => state.fabricRef)

	const { board, isBoardLoading, boardError, isSaving, saveStatus, saveBoardSnapshot } = useBoardState(
		boardId, authenticated, token, fabricRef
	)

	const {
		isConnecting, socketId, activeRoomKey, isRoomAdmin,
		joinError, roomUsers, joinRequests, joinRequestError, pendingJoinRequestIds,
		handleJoinRoom, handleApproveJoinRequest, handleDenyJoinRequest
	} = useRoomSocket({ socket, user, searchParams, setSearchParams, board })

	useEffect(() => {
		const currentMode = searchParams.get('mode')
		const currentBoardId = searchParams.get('boardId')
		const currentRoomKey = searchParams.get('roomKey')

		const next = new URLSearchParams()
		if (currentBoardId) {
			next.set('boardId', currentBoardId)
		} else if (currentRoomKey) {
			next.set('roomKey', currentRoomKey.toUpperCase())
		} else if (currentMode === 'create' || currentMode === 'join') {
			next.set('mode', currentMode)
		}

		if (next.toString() !== searchParams.toString()) {
			setSearchParams(next, { replace: true })
		}
	}, [searchParams, setSearchParams])

	if (!authenticated || !token || !user) {
		return <Navigate to='/login' replace />
	}

	if (isBoardLoading || boardError || (!activeRoomKey && !boardId) || (!activeRoomKey && boardId)) {
		return (
			<EditorLobby
				boardId={boardId} board={board} activeRoomKey={activeRoomKey}
				isBoardLoading={isBoardLoading} boardError={boardError}
				isConnecting={isConnecting} socketId={socketId}
				userEmail={user.email} initialMode={initialMode}
				joinError={joinError} onJoinRoom={handleJoinRoom}
			/>
		)
	}

	return (
		<Layout>
			<div className='flex h-full w-full'>
				<SideBar roomKey={activeRoomKey} socket={socket} socketId={socketId} currentUserEmail={user.email} users={roomUsers} />
				<main className='flex h-full min-w-0 flex-1 flex-col gap-4 p-4'>
					<EditorHeader
						board={board} activeRoomKey={activeRoomKey} userEmail={user.email}
						joinError={joinError} isSaving={isSaving} saveStatus={saveStatus}
						isConnecting={isConnecting} onSave={saveBoardSnapshot}
					/>
					<div className='min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
						<div className='relative h-full w-full'>
							<DrawingCanvas socket={socket} roomKey={activeRoomKey ?? ''} initialSnapshot={board?.snapshot || null} canClear={isRoomAdmin} />
							<JoinRequestsPanel
								isRoomAdmin={isRoomAdmin} joinRequests={joinRequests}
								pendingJoinRequestIds={pendingJoinRequestIds}
								joinRequestError={joinRequestError}
								onApprove={handleApproveJoinRequest} onDeny={handleDenyJoinRequest}
							/>
						</div>
					</div>
				</main>
			</div>
		</Layout>
	)
}

export default EditorPage