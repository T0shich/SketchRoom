import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
	size?: 'sm' | 'md' | 'lg' | 'icon'
	children: ReactNode
}

export const Button = ({
	variant = 'primary',
	size = 'md',
	className = '',
	children,
	...props
}: ButtonProps) => {
	const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'

	const variants = {
		primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
		secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
		outline: 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
		ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
		danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
	}

	const sizes = {
		sm: 'h-9 px-3 text-xs',
		md: 'h-11 px-4 text-sm',
		lg: 'h-12 px-6 text-base',
		icon: 'h-10 w-10 p-2',
	}

	const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

	return (
		<button className={combinedClassName} {...props}>
			{children}
		</button>
	)
}
