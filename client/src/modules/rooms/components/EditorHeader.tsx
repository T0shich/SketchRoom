import type { Board } from '../../../store/BoardAPI'

interface EditorHeaderProps {
	board: Board | null
	activeRoomKey: string | null
	userEmail: string
	joinError: string
	isSaving: boolean
	saveStatus: string
	isConnecting: boolean
	onSave: () => void
}

const EditorHeader = ({ board, activeRoomKey, userEmail, joinError, isSaving, saveStatus, isConnecting, onSave }: EditorHeaderProps) => {
	return (
		<div className='flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
			<div className='text-sm font-medium text-slate-700'>
				{board?.title ? `${board.title} • ` : ''}Комната {activeRoomKey}
			</div>
			<div className='text-xs text-slate-500'>Аккаунт: {userEmail}</div>
			{joinError && <div className='text-xs text-rose-500'>{joinError}</div>}
			<div className='flex items-center gap-3'>
				{board?.id && (
					<>
						<button
							type='button'
							onClick={onSave}
							disabled={isSaving}
							className='rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
						>
							{isSaving ? 'Сохранение...' : 'Сохранить'}
						</button>
						{saveStatus && <div className='text-xs text-slate-500'>{saveStatus}</div>}
					</>
				)}
				<div className='text-xs text-slate-500'>{isConnecting ? 'Онлайн' : 'Офлайн'}</div>
			</div>
		</div>
	)
}
export default EditorHeader