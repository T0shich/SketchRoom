import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
	variant?: 'default' | 'elevated' | 'flat' | 'outline'
}

export const Card = ({
	children,
	variant = 'default',
	className = '',
	...props
}: CardProps) => {
	const baseStyles = 'rounded-2xl bg-white p-6 transition-all duration-300'

	const variants = {
		default: 'border border-slate-200 shadow-sm hover:shadow-md/5',
		elevated: 'shadow-xl shadow-slate-200/50 border border-white hover:shadow-2xl hover:shadow-slate-300/60',
		flat: 'bg-slate-50 border-none',
		outline: 'border-2 border-slate-100 hover:border-slate-200',
	}

	const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`

	return (
		<div className={combinedClassName} {...props}>
			{children}
		</div>
	)
}
