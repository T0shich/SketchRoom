import type { ReactNode } from 'react'

interface LayoutProps {
	children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
	return <div className='relative h-screen w-full text-slate-900'>{children}</div>
}
