import type { InputHTMLAttributes } from 'react'

const AuthInput = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => {
	return (
		<input
			{...props}
			className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${className}`}
		/>
	)
}

export default AuthInput
