import type { JoinRequest } from '../types/types'

interface JoinRequestsPanelProps {
	isRoomAdmin: boolean
	joinRequests: JoinRequest[]
	pendingJoinRequestIds: string[]
	joinRequestError: string
	onApprove: (id: string) => void
	onDeny: (id: string) => void
}

const JoinRequestsPanel = ({ isRoomAdmin, joinRequests, pendingJoinRequestIds, joinRequestError, onApprove, onDeny }: JoinRequestsPanelProps) => {
	if (!isRoomAdmin || joinRequests.length === 0) return null

	return (
		<div className='pointer-events-none absolute right-4 top-4 z-20 flex w-80 flex-col gap-3'>
			{joinRequests.map((req) => {
				const isPending = pendingJoinRequestIds.includes(req.id)
				const displayName = (req.name || req.id).trim()
				return (
					<div key={req.id} className='pointer-events-auto rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
						<div className='mb-1 text-xs font-semibold tracking-[0.12em] text-slate-400'>ЗАПРОС НА ВХОД</div>
						<div className='mb-3 truncate text-sm font-medium text-slate-800' title={displayName}>{displayName}</div>
						<div className='flex items-center gap-2'>
							<button
								type='button' onClick={() => onApprove(req.id)} disabled={isPending}
								className='rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60'
							>
								{isPending ? '...' : 'Подтвердить'}
							</button>
							<button
								type='button' onClick={() => onDeny(req.id)} disabled={isPending}
								className='rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
							>
								Отклонить
							</button>
						</div>
					</div>
				)
			})}
			{joinRequestError && <div className='pointer-events-auto rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-rose-500'>{joinRequestError}</div>}
		</div>
	)
}
export default JoinRequestsPanel