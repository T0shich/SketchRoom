import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import AuthButton from '../ui/AuthButton'

const HomePage = () => {
	return (
		<Layout>
			<div className='flex min-h-screen items-center justify-center p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg'>
					<h1 className='mb-2 text-center text-3xl font-bold text-slate-900/90'>SketchRoom</h1>
					<p className='mb-8 text-center text-sm text-slate-600'>Выберите, куда перейти</p>
					<div className='flex flex-col gap-4'>
						<Link to='/login'>
							<AuthButton>Войти</AuthButton>
						</Link>
						<Link to='/register'>
							<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>Регистрация</AuthButton>
						</Link>
						<Link to='/editor'>
							<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>К холсту</AuthButton>
						</Link>
					</div>
				</div>
			</div>
		</Layout>
	)
}

export default HomePage
