import axios from 'axios'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { saveAuthToken } from '../store/auth'
import AuthButton from '../ui/AuthButton'
import AuthInput from '../ui/AuthInput'
import { Layout } from './Layout'

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

const RegisterForm = () => {
	const navigate = useNavigate()
	const [userData, setUserData] = useState({
		name: '',
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
			const response = await axios.post(`${API_URL}/auth/register`, {
				name: userData.name,
				email: userData.email,
				password: userData.password,
			})

			const token = response.data?.token
			if (!token) {
				alert('Токен не получен от сервера')
				return
			}

			saveAuthToken(token)
			navigate('/', { replace: true })
		} catch (error) {
			console.error('Ошибка при регистрации:', error)
			if (axios.isAxiosError(error)) {
				alert(error.response?.data?.message || 'Ошибка при регистрации')
				return
			}
			alert('Ошибка при регистрации')
		}
	}

	return (
		<Layout>
			<div className="flex items-center justify-center min-h-screen">
				<form onSubmit={handleSubmit} className="flex flex-col h-fit w-fit rounded-2xl bg-white px-13 py-10 gap-6 shadow-lg">
					<h2 className='text-2xl text-slate-900/80 font-bold text-center my-8'>Регистрация</h2>

					<div className="flex flex-col gap-8 min-w-80">
						<AuthInput name='name' value={userData.name} onChange={handleChange} type='text' placeholder='Имя пользователя' />
						<AuthInput name='email' value={userData.email} onChange={handleChange} type='email' placeholder='Email' />
						<AuthInput name='password' value={userData.password} onChange={handleChange} type='password' placeholder='Пароль' />
					</div>

					<AuthButton type='submit' className='mt-8'>
						Зарегистрироваться
					</AuthButton>
					<span className='text-center text-slate-600/70'>
						Уже есть аккаунт? <Link to='/login' className='text-blue-500/80 hover:underline'>Войти</Link>
					</span>
				</form>
			</div>

		</Layout>
	)
}

export default RegisterForm
