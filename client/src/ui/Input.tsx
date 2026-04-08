import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string
	error?: string
}

export const Input = ({
	label,
	error,
	className = '',
	id,
	...props
}: InputProps) => {
	const baseInputStyles = 'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

	const combinedInputClassName = `${baseInputStyles} ${error ? 'border-red-500 focus:ring-red-500/10' : ''} ${className}`

	return (
		<div className="flex w-full flex-col gap-1.5 transition-all">
			{label && (
				<label
					htmlFor={id}
					className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-0.5"
				>
					{label}
				</label>
			)}
			<input id={id} className={combinedInputClassName} {...props} />
			{error && <span className="text-[11px] font-medium text-red-500 px-0.5">{error}</span>}
		</div>
	)
}
