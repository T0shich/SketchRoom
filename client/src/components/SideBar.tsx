import MyButton from '../ui/MyButton'

const SideBar = () => {
	return (
		<aside className='flex h-full w-20 flex-col items-center border-r border-slate-200 bg-white/80 px-3 py-5 backdrop-blur'>
			<div className='mb-6 text-xs font-semibold tracking-[0.18em] text-slate-400'>SR</div>
			<MyButton active>+</MyButton>
		</aside>
	)
}

export default SideBar
