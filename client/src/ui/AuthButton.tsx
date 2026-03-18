import type { ButtonHTMLAttributes } from 'react'

const AuthButton = ({ className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
	return (
		<button
			{...props}
			type={type}
			className={`h-12 w-full rounded-xl border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:border-slate-800 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 ${className}`}
		/>
	)
}

export default AuthButton