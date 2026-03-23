import { Link } from 'react-router-dom'
import { getAuthUser, isAuthenticated } from '../store/Auth'
import AuthButton from '../ui/AuthButton'
import { Layout } from '../ui/Layout'
import AuthPage from './AuthPage'
const HomePage = () => {
	const authenticated = isAuthenticated()
	const user = getAuthUser()

	return (
		<Layout>
			<div className='absolute right-0 top-0 flex justify-end'><AuthPage /></div>
			<div className='flex min-h-screen items-center justify-center p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg'>
					<h1 className='mb-2 text-center text-3xl font-bold text-slate-900/90'>SketchRoom</h1>
					{authenticated ? (
						<>
							<div className='mb-6 text-center text-sm text-slate-600'>
								Вы вошли как <span className='font-medium text-slate-800'>{user?.email}</span>
							</div>
							<div className='flex flex-col gap-3'>
								<Link to='/editor?mode=create'>
									<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
										Создать холст
									</AuthButton>
								</Link>
								<Link to='/editor?mode=join'>
									<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
										Присоединиться к холсту
									</AuthButton>
								</Link>
								<Link to='/boards'>
									<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>
										Просмотреть доски
									</AuthButton>
								</Link>
							</div>
						</>
					) : (
						<div className='mt-4 text-center text-sm text-slate-600'>
							Войдите в аккаунт, чтобы создать холст или присоединиться к комнате
						</div>
					)}
				</div>
			</div>
		</Layout >
	)
}

export default HomePage
