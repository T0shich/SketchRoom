import { Link, useNavigate } from 'react-router-dom'
import GenerativeBackground from '../components/GenerativeBackground'
import { clearAuthToken, getAuthUser, isAuthenticated } from '../store/Auth'
const AuthPage = () => {
	const user = getAuthUser()
	const authenticated = isAuthenticated()
	const navigate = useNavigate()

	const handleLogout = () => {
		clearAuthToken()
		navigate('/')
	}




	return (
		<div className='flex gap-4 m-4'>

			<GenerativeBackground />

			{authenticated ? (
				<>
					<div className='rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-md'>
						{user?.email}
					</div>
					<button
						type='button'
						onClick={handleLogout}
						className='rounded-2xl bg-white px-6 py-3 shadow-md transition hover:bg-slate-200'
					>
						Выйти
					</button>
				</>
			) : (
				<>

					<Link className='bg-white py-3 px-6 rounded-2xl hover:bg-slate-200 shadow-md' to='/register'>
						Регистрация
					</Link>

					<Link className='bg-white py-3 px-6 rounded-2xl hover:bg-slate-200 shadow-md' to='/login'>
						Войти
					</Link>
				</>
			)}

		</div>
	)
}

export default AuthPage
