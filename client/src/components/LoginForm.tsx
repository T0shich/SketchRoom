import axios from 'axios'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthButton from '../ui/AuthButton'
import AuthInput from '../ui/AuthInput'
import { Layout } from './Layout'

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

const LoginForm = () => {
	const [userData, setUserData] = useState({
		email: '',
		password: ''
	})

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setUserData(prev => ({ ...prev, [name]: value }))
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		try {
			await axios.post(`${API_URL}/auth/login`, {
				email: userData.email,
				password: userData.password,
			})
			alert('Пользователь успешно вошел в систему!')
		} catch (error) {
			console.error('Ошибка при входе:', error)
			if (axios.isAxiosError(error)) {
				alert(error.response?.data?.message || 'Ошибка при входе')
				return
			}
			alert('Ошибка при входе')
		}
	}

	return (
		<Layout>
			<div className="flex items-center justify-center min-h-screen">
				<form onSubmit={handleSubmit} className="flex flex-col h-fit w-fit rounded-2xl bg-white px-13 py-10 gap-6 shadow-lg">
					<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Вход в систему</h2>

					<div className="flex flex-col gap-7 min-w-80">
						<AuthInput name='email' value={userData.email} onChange={handleChange} type='email' placeholder='Email' />
						<AuthInput name='password' value={userData.password} onChange={handleChange} type='password' placeholder='Пароль' />
					</div>

					<AuthButton type='submit' className='mt-6'>
						Войти
					</AuthButton>
					<span className='text-center text-slate-600/70'>
						Нет аккаунта? <Link to='/register' className='text-blue-500/80 hover:underline'>Зарегистрироваться</Link>
					</span>
				</form>
			</div>

		</Layout>
	)
}

export default LoginForm
