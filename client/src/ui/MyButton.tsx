import type { MouseEventHandler, ReactNode } from 'react'

interface MyButtonProps {
children: ReactNode
onClick?: MouseEventHandler<HTMLButtonElement>
active?: boolean
}

const MyButton = ({ children, onClick, active = false }: MyButtonProps) => {
return (
<button
onClick={onClick}
className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-medium transition ${
active
? 'border-slate-900 bg-slate-900 text-white'
: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
}`}
>
{children}
</button>
)
}

export default MyButton
