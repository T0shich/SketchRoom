import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Rooms } from '../modules/rooms'
import { getAuthToken, getAuthUser } from '../store/Auth'

const EditorModePage = () => {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const token = getAuthToken()
	const user = getAuthUser()
	const authenticated = Boolean(token && user)
	const modeQuery = searchParams.get('mode')
	const initialMode = modeQuery === 'join' ? 'join' : 'create'

	const handleJoinRoom = (key: string) => {
		navigate(`/canvas?roomKey=${key.toUpperCase()}`)
	}

	if (!authenticated) {
		return <Navigate to='/login' replace />
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-slate-100 p-6'>
			<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm'>
				<div className='mb-1 text-sm text-slate-500'>SketchRoom</div>
				<h1 className='mb-4 text-2xl font-semibold text-slate-900'>Совместная доска</h1>
				<div className='mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500'>
					Аккаунт: {user.email}
				</div>
				<Rooms onJoinRoom={handleJoinRoom} initialMode={initialMode} />
			</div>
		</div>
	)
}

export default EditorModePage
