import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import AuthButton from '../ui/AuthButton'
import AuthPage from './AuthPage'
const HomePage = () => {
	return (
		<Layout>
			<div className=" absolute right-0 top-0 flex justify-end"><AuthPage /></div>
			<div className='flex min-h-screen items-center justify-center p-6'>
				<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg'>
					<h1 className='mb-2 text-center text-3xl font-bold text-slate-900/90'>SketchRoom</h1>
					<Link to='/editor'>
						<AuthButton className='border-slate-700 bg-slate-700 hover:border-slate-600 hover:bg-slate-600'>К холсту</AuthButton>
					</Link>
				</div>
			</div>
		</Layout >
	)
}

export default HomePage
