import { Link } from 'react-router-dom'
const AuthPage = () => {
	return (
		<div className='flex gap-4 m-4'>

			<Link className="bg-white py-3 px-6 rounded-2xl hover:bg-slate-200 shadow-md" to="/register">
				Регистрация
			</Link>

			<Link className="bg-white py-3 px-6 rounded-2xl hover:bg-slate-200 shadow-md" to="/login">
				Войти
			</Link>

		</div>
	)
}

export default AuthPage
