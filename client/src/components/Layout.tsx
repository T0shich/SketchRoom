import type { ReactNode } from 'react'

interface LayoutProps {
	children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
	return <div className='h-screen w-full bg-slate-100 text-slate-900'>{children}</div>
}
